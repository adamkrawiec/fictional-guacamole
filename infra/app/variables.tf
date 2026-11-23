variable "project" {
  description = "Name used for resources and tags"
  type        = string
  default     = "fictional-guacamole"
}

variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "instance_type" {
  description = "Use whichever micro type the EC2 console marks as free-tier eligible in your region"
  type        = string
  default     = "t3.micro"
}

variable "container_port" {
  description = "Port the app listens on inside the container (PORT in the Dockerfile)"
  type        = number
  default     = 8000
}

variable "github_repo" {
  description = "owner/repo allowed to deploy"
  type        = string
  default     = "adamkrawiec/fictional-guacamole"
}

variable "github_owner_id" {
  description = "Numeric ID of the repo owner, as it appears in GitHub's OIDC subject (owner@ID)"
  type        = string
  default     = "35483316"
}

variable "github_repo_id" {
  description = "Numeric ID of the repo, as it appears in GitHub's OIDC subject (repo@ID)"
  type        = string
  default     = "1443529521"
}

variable "github_branch" {
  description = "Only workflow runs on this branch can deploy"
  type        = string
  default     = "main"
}

variable "create_github_oidc_provider" {
  description = "Set to false if this AWS account already has the token.actions.githubusercontent.com provider"
  type        = bool
  default     = true
}

variable "enable_load_balancer" {
  description = "Run the Application Load Balancer. Set to false to delete it (it's billed hourly and can't be paused) and serve the instance directly on an Elastic IP."
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN (same region as the ALB) to enable HTTPS on the load balancer. Leave null for HTTP only."
  type        = string
  default     = null
}

variable "enable_frontend" {
  description = "Host the React frontend in S3 behind CloudFront (which also forwards /api to the app). Set to false to delete the bucket and distribution."
  type        = bool
  default     = false
}

variable "enable_database" {
  description = "Run PostgreSQL on RDS for the API. To turn it off, first apply with db_deletion_protection = false."
  type        = bool
  default     = false
}

variable "db_instance_class" {
  description = "RDS instance size. db.t4g.micro is the smallest; check the console for free-tier eligibility."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL major version; matches the local Docker image. Use \"17\" if RDS doesn't offer 18 in the region."
  type        = string
  default     = "18"
}

variable "db_backup_retention_days" {
  description = "Days of automatic backups (0-35). Accounts on the AWS free plan may only allow 1."
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Block deleting the database. Set to false (and apply) before removing it."
  type        = bool
  default     = true
}

variable "email_from" {
  description = "Sender address for app emails (SES). Setting it creates the email queue, SES identity and worker config, and SES emails this address a verification link. null: emails off. Keep it out of the committed terraform.tfvars: use private.auto.tfvars (git-ignored)."
  type        = string
  default     = null
}

variable "alert_email" {
  description = "Where alarms are emailed (e.g. emails stuck in the dead-letter queue). null: no alarms. Needs email_from too."
  type        = string
  default     = null
}
