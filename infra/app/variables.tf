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
