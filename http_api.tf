data "aws_partition" "current" {}
data "aws_region" "current" {}

resource "aws_apigatewayv2_api" "event_api" {
  name          = "${var.env}-${var.project}-api"
  description   = "Event API"
  version       = "1.0"
  
  protocol_type = "HTTP"

  body          = templatefile("${path.module}/event-api.yaml", {
    title = "${var.env}-${var.project}-api"
    get_event_lambda_arn  = aws_lambda_function.get_event_lambda.arn
    post_event_lambda_arn  = aws_lambda_function.post_event_lambda.arn
    open_queue = aws_sqs_queue.event_queue.id
    aws_partition = data.aws_partition.current.partition
    aws_region = data.aws_region.current.name
  })

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS", "DELETE", "PUT"]
    allow_headers = ["*"]
    max_age = 600
  }
}

resource "aws_apigatewayv2_stage" "read_receipt_stage" {
  api_id = aws_apigatewayv2_api.event_api.id
  name   = var.env
  auto_deploy = true
}

# get-event-data-handler-lambda Invoke Permission
resource "aws_lambda_permission" "api-gatewayv2-invoke-post-event-lambda" {
  statement_id  = "AllowAPIGatewayV2Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_event_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.event_api.execution_arn}/*/*"
}

# get-event-data-handler-lambda Invoke Permission
resource "aws_lambda_permission" "api-gatewayv2-invoke-get-event-lambda" {
  statement_id  = "AllowAPIGatewayV2Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_event_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.event_api.execution_arn}/*/*"
}
