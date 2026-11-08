# ---------- Public Application Load Balancer in front of the instance ----------
# Internet -> ALB (port 80, or 443 when certificate_arn is set) -> instance port 80 -> container.
# While the load balancer is enabled, the instance only accepts traffic from the ALB's security group.
#
# An ALB can't be paused - it's billed every hour it exists. Set enable_load_balancer = false to
# delete it and expose the instance directly (see ec2.tf); set it back to true to recreate it.

# An ALB needs subnets in at least two Availability Zones; the default VPC has one per AZ.
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

locals {
  lb_enabled    = var.enable_load_balancer
  https_enabled = local.lb_enabled && var.certificate_arn != null
}

resource "aws_security_group" "alb" {
  count = local.lb_enabled ? 1 : 0

  name        = "${var.project}-alb"
  description = "Public HTTP/HTTPS in, forwards to the app instance only."
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  count = local.lb_enabled ? 1 : 0

  security_group_id = aws_security_group.alb[0].id
  description       = "HTTP from anywhere (redirected to HTTPS when a certificate is set)"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  count = local.https_enabled ? 1 : 0

  security_group_id = aws_security_group.alb[0].id
  description       = "HTTPS from anywhere"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  count = local.lb_enabled ? 1 : 0

  security_group_id            = aws_security_group.alb[0].id
  description                  = "To the app instance"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.app.id
}

resource "aws_lb" "app" {
  count = local.lb_enabled ? 1 : 0

  name               = var.project
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = data.aws_subnets.default.ids

  drop_invalid_header_fields = true
}

resource "aws_lb_target_group" "app" {
  count = local.lb_enabled ? 1 : 0

  name        = "${var.project}-app"
  port        = 80
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = data.aws_vpc.default.id

  # Faster deploys: don't hold old connections open for the default 300s
  deregistration_delay = 30

  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group_attachment" "app" {
  count = local.lb_enabled ? 1 : 0

  target_group_arn = aws_lb_target_group.app[0].arn
  target_id        = aws_instance.app.id
  port             = 80
}

# Port 80: forwards to the app, or redirects to HTTPS once a certificate is configured
resource "aws_lb_listener" "http" {
  count = local.lb_enabled ? 1 : 0

  load_balancer_arn = aws_lb.app[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = local.https_enabled ? "redirect" : "forward"
    target_group_arn = local.https_enabled ? null : aws_lb_target_group.app[0].arn

    dynamic "redirect" {
      for_each = local.https_enabled ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

resource "aws_lb_listener" "https" {
  count = local.https_enabled ? 1 : 0

  load_balancer_arn = aws_lb.app[0].arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[0].arn
  }
}

# ---------- State migration ----------
# These resources were created before the toggle existed (without count). The moved blocks tell
# Terraform they are the same objects at their new [0] addresses, so nothing is recreated.
# Safe to delete once every copy of the state has been applied with this version.
moved {
  from = aws_security_group.alb
  to   = aws_security_group.alb[0]
}

moved {
  from = aws_vpc_security_group_ingress_rule.alb_http
  to   = aws_vpc_security_group_ingress_rule.alb_http[0]
}

moved {
  from = aws_vpc_security_group_egress_rule.alb_to_app
  to   = aws_vpc_security_group_egress_rule.alb_to_app[0]
}

moved {
  from = aws_lb.app
  to   = aws_lb.app[0]
}

moved {
  from = aws_lb_target_group.app
  to   = aws_lb_target_group.app[0]
}

moved {
  from = aws_lb_target_group_attachment.app
  to   = aws_lb_target_group_attachment.app[0]
}

moved {
  from = aws_lb_listener.http
  to   = aws_lb_listener.http[0]
}

moved {
  from = aws_vpc_security_group_ingress_rule.http_from_alb
  to   = aws_vpc_security_group_ingress_rule.http_from_alb[0]
}
