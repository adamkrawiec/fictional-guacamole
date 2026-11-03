# One-time setup: the S3 bucket that stores Terraform state for infra/app.
# This config keeps its own (tiny) state locally - run it once, then leave it alone.
#
#   cd infra/bootstrap
#   terraform init && terraform apply

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

variable "region" {
  type    = string
  default = "eu-central-1"
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "fictional-guacamole"
      ManagedBy = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "tfstate" {
  # Bucket names are global, so the account ID keeps it unique
  bucket = "fictional-guacamole-tfstate-${data.aws_caller_identity.current.account_id}"

  lifecycle {
    prevent_destroy = false
  }
}

# Keeps old state versions, so a bad apply can be rolled back
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "state_bucket" {
  value = aws_s3_bucket.tfstate.bucket
}
