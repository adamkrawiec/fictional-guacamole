output "app_url" {
  description = "The load balancer's URL when enabled, otherwise the instance's Elastic IP"
  value = (
    local.lb_enabled
    ? "${local.https_enabled ? "https" : "http"}://${aws_lb.app[0].dns_name}"
    : "http://${aws_eip.app[0].public_ip}"
  )
}

output "alb_dns_name" {
  description = "Point a DNS record (CNAME, or Route 53 alias) at this. Null while the load balancer is disabled."
  value       = local.lb_enabled ? aws_lb.app[0].dns_name : null
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

output "frontend_url" {
  description = "Public URL of the site: frontend + /api. Null while the frontend is disabled."
  value       = local.frontend_enabled ? "https://${aws_cloudfront_distribution.web[0].domain_name}" : null
}

output "frontend_bucket" {
  description = "GitHub repository variable FRONTEND_BUCKET"
  value       = local.frontend_enabled ? aws_s3_bucket.web[0].bucket : null
}

output "cloudfront_distribution_id" {
  description = "GitHub repository variable CLOUDFRONT_DISTRIBUTION_ID"
  value       = local.frontend_enabled ? aws_cloudfront_distribution.web[0].id : null
}
