---

name: terraform-change-handoff
description: Use when editing Terraform in a project where Claude must not run terraform or the AWS CLI, so changes are handed to the user to plan and apply.
---

# Terraform changes handed off to the user

## Rules

- Check `.claude/settings.json` / hooks: if `terraform`, `tofu` or `aws` are blocked, never run them in any shell. Give the user the commands instead.
- Leave changes uncommitted on the current branch unless asked.

## Before editing

- Read every `.tf` file in the module, including `outputs.tf`, `variables.tf`, `versions.tf`, and any `user_data` templates.
- Note where state lives (local `terraform.tfstate` vs a remote backend).
- Note leftovers from other tools (e.g. a CloudFormation stack file) that Terraform doesn't manage.

## Editing

- Put a new concern in its own file (e.g. `alb.tf`) and reuse existing data sources (`data.aws_vpc.default`, `var.project`, `data.aws_partition.current`).
- Optional features go behind a variable that defaults off (e.g. `certificate_arn = null` with `count = ... ? 1 : 0` and `dynamic` blocks).
- Prefer separate `aws_vpc_security_group_*_rule` resources over inline rules, and reference security groups instead of CIDRs between tiers.
- When removing a resource, grep the module for leftover references (outputs especially).
- Keep resource names within AWS limits (ALB and target group names: 32 chars).

## Report to the user

- What changed, per file.
- Expected `terraform plan` shape: roughly how many adds/destroys. Anything that would replace a stateful resource (e.g. the EC2 instance, `-/+`) means stop and investigate before applying.
- Consequences of applying: endpoints that change or stop working, a possible short downtime window (and the two-step alternative), and new monthly cost, including public IPv4 charges per AZ for load balancers.
- Run `terraform plan` from the same machine and folder when state is local.
- Mention resources outside Terraform the user may need to clean up themselves.
