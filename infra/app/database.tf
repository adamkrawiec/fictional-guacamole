# ---------- PostgreSQL on RDS, reachable only from the app instance ----------
# App instance -> RDS (port 5432, private: no public IP). The app gets DATABASE_URL from an
# encrypted SSM parameter at deploy time (see deploy.tf); the password is generated here.
#
# Turning the database off: deletion protection is on, so first apply with
# db_deletion_protection = false, then set enable_database = false. A final snapshot is kept.

locals {
  db_enabled = var.enable_database
  db_name    = "guacamole"
  db_user    = "guac"
}

# Generated once and stored in Terraform state (local, git-ignored) and in SSM. Letters and
# digits only, so it can go into a URL without escaping.
resource "random_password" "db" {
  count = local.db_enabled ? 1 : 0

  length  = 32
  special = false
}

# RDS needs subnets in at least two AZs; reuse the default-VPC subnets the ALB config looks up
resource "aws_db_subnet_group" "db" {
  count = local.db_enabled ? 1 : 0

  name       = "${var.project}-db"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_security_group" "db" {
  count = local.db_enabled ? 1 : 0

  name        = "${var.project}-db"
  description = "PostgreSQL from the app instance only"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  count = local.db_enabled ? 1 : 0

  security_group_id            = aws_security_group.db[0].id
  description                  = "PostgreSQL from the app instance"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.app.id
}

resource "aws_db_instance" "db" {
  count = local.db_enabled ? 1 : 0

  identifier     = var.project
  engine         = "postgres"
  engine_version = var.db_engine_version # major version only; RDS picks and upgrades the minor
  instance_class = var.db_instance_class

  db_name  = local.db_name
  username = local.db_user
  password = random_password.db[0].result

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_subnet_group_name   = aws_db_subnet_group.db[0].name
  vpc_security_group_ids = [aws_security_group.db[0].id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period    = var.db_backup_retention_days
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  # Deleting the database is the one change that can't be undone
  deletion_protection       = var.db_deletion_protection
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project}-final"
}

# The full connection string, encrypted with the account's default SSM key.
# RDS for PostgreSQL requires TLS by default, hence sslmode=require.
resource "aws_ssm_parameter" "database_url" {
  count = local.db_enabled ? 1 : 0

  name        = "/${var.project}/database-url"
  description = "DATABASE_URL for the ${var.project} API"
  type        = "SecureString"
  value       = "postgresql://${local.db_user}:${random_password.db[0].result}@${aws_db_instance.db[0].address}:${aws_db_instance.db[0].port}/${local.db_name}?sslmode=require"
}

# The deploy document (deploy.tf) runs on the instance and reads the parameter
resource "aws_iam_role_policy" "read_database_url" {
  count = local.db_enabled ? 1 : 0

  name = "read-database-url"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = aws_ssm_parameter.database_url[0].arn
    }]
  })
}
