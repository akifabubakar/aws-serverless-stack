terraform init -reconfigure -backend-config=config/prod/backend.conf &&
terraform validate &&
terraform apply -var-file=./config/uat/env.tfvars