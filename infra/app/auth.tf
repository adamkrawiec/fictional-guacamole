# ---------- Better Auth (API sign-up / sign-in) ----------
# The API needs two values at runtime, written into its env file by the deploy document (deploy.tf):
#   BETTER_AUTH_SECRET  signs session cookies. Generated here, kept in an encrypted SSM parameter.
#                       Without it the API refuses to start in production.
#   BETTER_AUTH_URL     the public URL browsers use. Better Auth rejects requests from any other origin,
#                       and CloudFront doesn't forward Host, so the API can't work this out itself.
# Not behind a toggle: the API can't run without them.
#
# Changing the secret (e.g. `terraform apply -replace=random_password.better_auth_secret`) signs
# everyone out on the next deploy.

locals {
  # Same choice as outputs.tf: the CloudFront site when enabled, otherwise the API's own address
  better_auth_url = (
    local.frontend_enabled
    ? "https://${aws_cloudfront_distribution.web[0].domain_name}"
    : (
      local.lb_enabled
      ? "${local.https_enabled ? "https" : "http"}://${aws_lb.app[0].dns_name}"
      : "http://${aws_eip.app[0].public_ip}"
    )
  )
}

# Stored in Terraform state (local, git-ignored) and in SSM, like the database password
resource "random_password" "better_auth_secret" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "better_auth_secret" {
  name        = "/${var.project}/better-auth-secret"
  description = "BETTER_AUTH_SECRET for the ${var.project} API"
  type        = "SecureString"
  value       = random_password.better_auth_secret.result
}

# The deploy document runs on the instance and reads the parameter
resource "aws_iam_role_policy" "read_better_auth_secret" {
  name = "read-better-auth-secret"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = aws_ssm_parameter.better_auth_secret.arn
    }]
  })
}
