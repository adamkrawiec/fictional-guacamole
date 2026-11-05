output "app_url" {
  value = "${local.https_enabled ? "https" : "http"}://${aws_lb.app.dns_name}"
}

output "alb_dns_name" {
  description = "Point a DNS record (CNAME, or Route 53 alias) at this"
  value       = aws_lb.app.dns_name
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
