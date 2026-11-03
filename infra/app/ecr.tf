resource "aws_ecr_repository" "app" {
  name                 = var.project
  image_tag_mutability = "MUTABLE" # allows a moving "latest" tag next to the commit-SHA tags

  # Lets `terraform destroy` remove the repo even if it still has images
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep storage (and cost) small: only the 10 newest images are kept
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
