# ---------- Network: default VPC, HTTP in from the load balancer only, no SSH ----------
data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "app" {
  name        = "${var.project}-app"
  description = "HTTP in, all out. No SSH - use SSM Session Manager instead."
  vpc_id      = data.aws_vpc.default.id
}

# Only the load balancer can reach the app; the instance keeps a public IP solely for outbound
# traffic (ECR, SSM, CloudWatch), but nothing on the internet can connect to it directly.
resource "aws_vpc_security_group_ingress_rule" "http_from_alb" {
  security_group_id            = aws_security_group.app.id
  description                  = "HTTP from the load balancer"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.app.id
  description       = "Outbound: ECR, SSM, package repos"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# ---------- Instance permissions ----------
resource "aws_iam_role" "instance" {
  name = "${var.project}-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# SSM: lets GitHub Actions run the deploy command, and gives you a browser shell (Session Manager)
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Pull images from ECR
resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Ship container logs to CloudWatch
resource "aws_iam_role_policy" "logs" {
  name = "write-app-logs"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.app.arn}:*"
    }]
  })
}

resource "aws_iam_instance_profile" "instance" {
  name = "${var.project}-instance"
  role = aws_iam_role.instance.name
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project}/app"
  retention_in_days = 14
}

# ---------- The instance ----------
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023_ami.insecure_value # an AMI ID isn't secret; keeps plan output readable
  instance_type          = var.instance_type
  iam_instance_profile   = aws_iam_instance_profile.instance.name
  vpc_security_group_ids = [aws_security_group.app.id]

  metadata_options {
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2          # lets a container reach instance credentials if the app ever needs AWS APIs
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    region         = var.region
    registry       = split("/", aws_ecr_repository.app.repository_url)[0]
    repository_url = aws_ecr_repository.app.repository_url
    log_group      = aws_cloudwatch_log_group.app.name
    container_port = var.container_port
  })

  tags = {
    Name = var.project
  }

  lifecycle {
    # A new Amazon Linux release would otherwise replace the instance on the next apply
    ignore_changes = [ami]
  }
}
