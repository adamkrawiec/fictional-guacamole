# ---------- App emails: SQS queue -> worker container -> Amazon SES ----------
# API (sign-up hook) --SendMessage--> SQS "emails" --long poll--> worker container --SendEmail--> SES
# A message that fails 5 times moves to the dead-letter queue (kept 14 days) instead of retrying forever.
#
# Off until email_from is set (put it in the git-ignored private.auto.tfvars). Setting it makes SES
# email that address a verification link: click it before anything can be sent.
# New SES accounts are in the sandbox (delivers only to verified addresses): request production
# access in the SES console to email real users. That request isn't managed by Terraform.

locals {
  email_enabled = var.email_from != null
}

# ---------- Queue ----------
resource "aws_sqs_queue" "emails_dlq" {
  count = local.email_enabled ? 1 : 0

  name                      = "${var.project}-emails-dlq"
  message_retention_seconds = 1209600 # 14 days, the maximum: time to look at what failed
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "emails" {
  count = local.email_enabled ? 1 : 0

  name                       = "${var.project}-emails"
  visibility_timeout_seconds = 60     # a received message stays hidden this long; one send takes ~1 s
  receive_wait_time_seconds  = 20     # long polling: fewer empty receives, lower cost
  message_retention_seconds  = 345600 # 4 days, if the worker is down
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.emails_dlq[0].arn
    maxReceiveCount     = 5
  })
}

# Only the emails queue may use this dead-letter queue
resource "aws_sqs_queue_redrive_allow_policy" "emails_dlq" {
  count = local.email_enabled ? 1 : 0

  queue_url = aws_sqs_queue.emails_dlq[0].id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.emails[0].arn]
  })
}

# ---------- SES sender ----------
# An email address identity, as there's no domain. Mail "from" a gmail.com/outlook.com address sent
# through SES fails DMARC, so expect it in spam. With a domain later, replace this with a domain
# identity (plus DKIM DNS records); the app code doesn't change.
resource "aws_sesv2_email_identity" "sender" {
  count = local.email_enabled ? 1 : 0

  email_identity = var.email_from
}

# ---------- Permissions for the API and worker (they share the instance role) ----------
resource "aws_iam_role_policy" "app_email" {
  count = local.email_enabled ? 1 : 0

  name = "app-email"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "UseEmailQueue"
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",             # API: enqueue
          "sqs:ReceiveMessage",          # worker: poll
          "sqs:DeleteMessage",           # worker: done
          "sqs:ChangeMessageVisibility", # worker: retry sooner / extend
          "sqs:GetQueueAttributes",
        ]
        Resource = aws_sqs_queue.emails[0].arn
      },
      {
        # Any identity, because in the sandbox SES also authorizes against the recipient's identity;
        # the condition limits sending to the one From address.
        Sid      = "SendAsAppSender"
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "arn:${data.aws_partition.current.partition}:ses:${var.region}:${data.aws_caller_identity.current.account_id}:identity/*"
        Condition = {
          StringEquals = { "ses:FromAddress" = var.email_from }
        }
      },
    ]
  })
}

# ---------- Alarm: anything in the dead-letter queue ----------
# Optional: set alert_email too. AWS emails that address a "Confirm subscription" link first.
locals {
  email_alerts_enabled = local.email_enabled && var.alert_email != null
}

resource "aws_sns_topic" "alerts" {
  count = local.email_alerts_enabled ? 1 : 0

  name = "${var.project}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count = local.email_alerts_enabled ? 1 : 0

  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "emails_dlq_not_empty" {
  count = local.email_alerts_enabled ? 1 : 0

  alarm_name          = "${var.project}-emails-failed"
  alarm_description   = "Emails failed 5 times and landed in ${aws_sqs_queue.emails_dlq[0].name}. Check the worker log stream."
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = aws_sqs_queue.emails_dlq[0].name }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]
  ok_actions          = [aws_sns_topic.alerts[0].arn]
}
