# Provider Block
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.6.0"
    }
  }
}
terraform {
  backend "s3" {

  }
}
provider "aws" {
  default_tags {
    tags = {
      environment = var.env
      project     = var.project
      repository  = var.repository
      createdby   = var.createdby
    }
  }
}
