# ---------- Frontend: React build in a private S3 bucket, served by CloudFront ----------
# Browser -> CloudFront (HTTPS, *.cloudfront.net)
#              /api, /api/*  -> the API: the ALB when enabled, otherwise the instance's Elastic IP (not cached)
#              everything else -> S3 bucket via Origin Access Control (cached)
# One domain for both, so the frontend calls the relative path /api: no CORS, no API URL in the build.
#
# Set enable_frontend = false to delete all of this (the bucket's files go with it).

locals {
  frontend_enabled = var.enable_frontend

  # CloudFront origins must be DNS names, not IPs. Same toggle as outputs.tf's app_url.
  api_origin_domain = local.lb_enabled ? aws_lb.app[0].dns_name : aws_eip.app[0].public_dns
}

# ---------- Bucket (private; only this distribution can read it) ----------
resource "aws_s3_bucket" "web" {
  count = local.frontend_enabled ? 1 : 0

  # Bucket names are global across all AWS accounts; the account ID keeps this one unique
  bucket        = "${var.project}-web-${data.aws_caller_identity.current.account_id}"
  force_destroy = true # like ECR: `terraform destroy` works even with files inside
}

resource "aws_s3_bucket_public_access_block" "web" {
  count = local.frontend_enabled ? 1 : 0

  bucket                  = aws_s3_bucket.web[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "web" {
  count = local.frontend_enabled ? 1 : 0

  name                              = "${var.project}-web"
  description                       = "CloudFront signs its requests to the ${var.project} frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "web_bucket" {
  count = local.frontend_enabled ? 1 : 0

  statement {
    sid       = "CloudFrontRead"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.web[0].arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    # Without this, any CloudFront distribution in any account could read the bucket
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.web[0].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "web" {
  count = local.frontend_enabled ? 1 : 0

  bucket = aws_s3_bucket.web[0].id
  policy = data.aws_iam_policy_document.web_bucket[0].json

  depends_on = [aws_s3_bucket_public_access_block.web]
}

# ---------- Client-side routes ----------
# A path without a file extension (/todos/5) is a React route: serve the app shell instead.
# Attached to the S3 behaviour only, so API 404s stay JSON. (CloudFront's custom error responses
# would apply to the whole distribution, /api included.)
resource "aws_cloudfront_function" "spa_rewrite" {
  count = local.frontend_enabled ? 1 : 0

  name    = "${var.project}-spa-rewrite"
  comment = "Serve index.html for client-side routes"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      if (!request.uri.includes(".")) {
        request.uri = "/index.html";
      }
      return request;
    }
  EOT
}

# ---------- AWS-managed policies (looked up by name, not created) ----------
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

# Forwards cookies, query strings and headers to the API, except Host (it would be *.cloudfront.net)
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# ---------- Distribution ----------
resource "aws_cloudfront_distribution" "web" {
  count = local.frontend_enabled ? 1 : 0

  enabled             = true
  comment             = "${var.project}: frontend (S3) + API"
  default_root_object = "index.html"
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  price_class         = "PriceClass_100" # edge locations in Europe + North America only: cheapest

  origin {
    origin_id                = "web"
    domain_name              = aws_s3_bucket.web[0].bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.web[0].id
  }

  origin {
    origin_id   = "api"
    domain_name = local.api_origin_domain

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # the instance / ALB listen on HTTP; browser -> CloudFront is HTTPS
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Everything that isn't the API -> S3, cached, with the SPA rewrite
  default_cache_behavior {
    target_origin_id       = "web"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite[0].arn
    }
  }

  # The API -> Express, never cached. "/api/*" doesn't match "/api" itself, hence both patterns.
  dynamic "ordered_cache_behavior" {
    for_each = ["/api", "/api/*"]

    content {
      path_pattern             = ordered_cache_behavior.value
      target_origin_id         = "api"
      viewer_protocol_policy   = "redirect-to-https"
      allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods           = ["GET", "HEAD"]
      compress                 = true
      cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
      origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true # free HTTPS on *.cloudfront.net
  }
}

# ---------- Let GitHub Actions upload the build and refresh the cache ----------
# A separate policy on the existing deploy role (see github.tf), so it comes and goes with the toggle.
resource "aws_iam_role_policy" "github_deploy_frontend" {
  count = local.frontend_enabled ? 1 : 0

  name = "deploy-frontend"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListFrontendBucket" # `aws s3 sync` compares against what's already there
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.web[0].arn
      },
      {
        Sid      = "UploadFrontend"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:DeleteObject"] # DeleteObject for `sync --delete`
        Resource = "${aws_s3_bucket.web[0].arn}/*"
      },
      {
        Sid      = "InvalidateFrontendCache"
        Effect   = "Allow"
        Action   = "cloudfront:CreateInvalidation"
        Resource = aws_cloudfront_distribution.web[0].arn
      },
    ]
  })
}
