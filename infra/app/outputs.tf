output "app_url" {
  value = "http://${aws_eip.app.public_ip}"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "instance_id" {
  value = aws_instance.app.id
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "log_group" {
  value = aws_cloudwatch_log_group.app.name
}
