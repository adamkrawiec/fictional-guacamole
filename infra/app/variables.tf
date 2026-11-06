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
