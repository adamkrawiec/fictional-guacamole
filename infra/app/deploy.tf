# ---------- Deploy script as an SSM command document ----------
# GitHub Actions runs this on the instance with `aws ssm send-command --document-name ...`.
# Unlike the deploy-app script written by user_data (first boot only), Terraform updates this
# document in place, so changing how deploys work never replaces the instance.
# The old /usr/local/bin/deploy-app keeps working until deploy.yml switches over.

resource "aws_ssm_document" "deploy" {
  name            = "${var.project}-deploy"
  document_type   = "Command"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "2.2"
    description   = "Pull an image from ECR, pass the app's environment, optionally migrate, and restart the container"
    parameters = {
      ImageTag = {
        type           = "String"
        description    = "Image tag to deploy (the commit SHA)"
        allowedPattern = "^[A-Za-z0-9._-]{1,128}$"
      }
      MigrateCommand = {
        type           = "String"
        description    = "Run in a one-off container before the switch-over, e.g. a prisma migrate deploy command. Empty: skip."
        default        = ""
        allowedPattern = "^[A-Za-z0-9 ./:_-]{0,200}$"
      }
    }
    mainSteps = [{
      action = "aws:runShellScript"
      name   = "deploy"
      inputs = {
        timeoutSeconds = "600"
        runCommand = split("\n", templatefile("${path.module}/deploy.sh.tftpl", {
          region                 = var.region
          registry               = split("/", aws_ecr_repository.app.repository_url)[0]
          repository_url         = aws_ecr_repository.app.repository_url
          log_group              = aws_cloudwatch_log_group.app.name
          container_port         = var.container_port
          env_dir                = "/etc/${var.project}"
          database_url_parameter = local.db_enabled ? aws_ssm_parameter.database_url[0].name : ""
          auth_secret_parameter  = aws_ssm_parameter.better_auth_secret.name
          better_auth_url        = local.better_auth_url
        }))
      }
    }]
  })
}
