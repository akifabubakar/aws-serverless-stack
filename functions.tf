#SQS Creation
resource "aws_sqs_queue" "event_queue" {
  name                      = "${var.env}-${var.project}-queue"
  message_retention_seconds = 86400 # 1 day
  receive_wait_time_seconds = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

#SQS Dead Letter Queue
resource "aws_sqs_queue" "deadletter_queue" {
  name = "${var.env}-${var.project}-deadletter-queue"
  message_retention_seconds   = 345600 # 4 days

}

# Data Archive - Get Event 
data "archive_file" "get_event_archive" {
  type        = "zip"
  source_dir  = "./functions/get_event"
  output_path = "./functions/get_event.zip"
}

# Data Archive - Store Read Event
data "archive_file" "store_event_archive" {
  type        = "zip"
  source_dir = "./functions/store_event"
  output_path = "./functions/store_event.zip"
}

# Data Archive - Post Read Event
data "archive_file" "post_event_archive" {
  type        = "zip"
  source_dir = "./functions/post_event"
  output_path = "./functions/post_event.zip"
}

# Data Archive - Post Deadletter
data "archive_file" "post_deadletter_archive" {
  type        = "zip"
  source_dir = "./functions/post_deadletter"
  output_path = "./functions/post_deadletter.zip"
}

# Create get_event_data_handler Lambda function
resource "aws_lambda_function" "get_event_lambda" {

  filename      = "./functions/get_event.zip"
  function_name = "${var.env}-${var.project}-get-lambda"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  source_code_hash = data.archive_file.get_event_archive.output_base64sha256
  environment {
    variables = {
      EVENT_TABLE_NAME = aws_dynamodb_table.event_table.name
    }
  }
}

# Create store_read_data_handler Lambda function
resource "aws_lambda_function" "store_event_lambda" {

  filename      = "./functions/store_event.zip"
  function_name = "${var.env}-${var.project}-store-lambda"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  source_code_hash = data.archive_file.store_event_archive.output_base64sha256

  environment {
    variables = {
      EVENT_TABLE_NAME = aws_dynamodb_table.event_table.name
    }
  }
}

# Create store_read_data_handler Lambda function
resource "aws_lambda_function" "post_event_lambda" {

  filename      = "./functions/post_event.zip"
  function_name = "${var.env}-${var.project}-post-lambda"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  source_code_hash = data.archive_file.post_event_archive.output_base64sha256

  environment {
    variables = {
      QUEUE_URL = aws_sqs_queue.event_queue.url
    }
  }
}

# Create post_deadletter_lambda Lambda function
resource "aws_lambda_function" "post_deadletter_lambda" {

  filename      = "./functions/post_deadletter.zip"
  function_name = "${var.env}-${var.project}-post-deadletter-lambda"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  source_code_hash = data.archive_file.post_deadletter_archive.output_base64sha256
}

# setup SQS as source to store-event-lambda
resource "aws_lambda_event_source_mapping" "event_queue_trigger" {
  enabled           = true
  event_source_arn  = aws_sqs_queue.event_queue.arn
  function_name     = aws_lambda_function.store_event_lambda.arn
  batch_size        = 100
  function_response_types             = ["ReportBatchItemFailures"]
  maximum_batching_window_in_seconds  = 20
}

# setup SQS as source to post_deadletter_lambda
resource "aws_lambda_event_source_mapping" "deadletter_queue_trigger" {
  enabled           = true
  event_source_arn  = aws_sqs_queue.deadletter_queue.arn
  function_name     = aws_lambda_function.post_deadletter_lambda.arn
  batch_size        = 10
  maximum_batching_window_in_seconds  = 20
}