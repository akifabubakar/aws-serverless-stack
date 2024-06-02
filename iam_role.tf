#lambda role creation
resource "aws_iam_role" "lambda_role" {
  name = "${var.env}-${var.project}-lambda-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

# creating Dynamodb access policy for lambda role
resource "aws_iam_policy" "dynamodb_policy" {
  name        = "${var.env}-${var.project}-dynamodb-policy"
  description = "Full access to DynamoDB"
  policy      = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:*"
      ],
      "Resource": "${aws_dynamodb_table.event_table.arn}"
    }
  ]
}
EOF
}

# Creating SQS access policy to http api role
resource "aws_iam_policy" "lambda_sqs_policy" {
  name        = "${var.env}-${var.project}-lambda-sqs-policy"
  description = "Full access to SQS"
  policy      = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:*"
      ],
      "Resource": [
        "${aws_sqs_queue.event_queue.arn}",
        "${aws_sqs_queue.deadletter_queue.arn}"
      ]
    }
  ]
}
EOF
}

# Creating Cloudwatch access policy to lambda role
resource "aws_iam_policy" "cloudwatch_policy" {
  name        = "${var.env}-${var.project}-cloudwatch-policy"
  description = "Full access to CloudWatch Logs"
  policy      = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

# Attach Cloudwatch, SQS and DynamoDB policy to Lambda Role
resource "aws_iam_role_policy_attachment" "cloudwatch_policy_lambda_role_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.cloudwatch_policy.arn
}

resource "aws_iam_role_policy_attachment" "sqs_lambda_role_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_sqs_policy.arn
}

resource "aws_iam_role_policy_attachment" "db_lambda_role_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.dynamodb_policy.arn
}
