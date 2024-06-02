#Create Dynamo DB

resource "aws_dynamodb_table" "event_table" {
  name    = "${var.env}-${var.project}-table"
  billing_mode = "PAY_PER_REQUEST"
  
  hash_key = "EventUser"
  range_key = "Timestamp"

  attribute {
    name  = "EventUser"
    type  = "S"
  }

  attribute {
    name  = "Timestamp"
    type  = "S"
  }

  attribute {
    name  = "EventId"
    type  = "S"
  }

  attribute {
    name  = "EventStatus"
    type  = "S"
  }

  attribute {
    name = "ExportDate"
    type = "S"
  }

  global_secondary_index {
    name               = "EventId-Index"
    hash_key           = "EventId"
    range_key          = "Timestamp"
    projection_type    = "INCLUDE"
    non_key_attributes = ["Status","Source","DigitalId","DeviceId","AppVersion","AppId","LeadId"]
  }

  global_secondary_index {
    name               = "EventStatus-Index"
    hash_key           = "EventStatus"
    range_key          = "Timestamp"
    projection_type    = "INCLUDE"
    non_key_attributes = ["EventId","Status","Source","DigitalId","DeviceId","AppVersion","AppId","LeadId"]
  }

  global_secondary_index {
    name               = "ExportDate-Index"
    hash_key           = "ExportDate"
    projection_type    = "INCLUDE"
    non_key_attributes = ["EventId","Status","Source","DigitalId","Timestamp","DeviceId","AppVersion","AppId","LeadId"]
  }

}