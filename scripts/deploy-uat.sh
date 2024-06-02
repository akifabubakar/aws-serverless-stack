terraform init -reconfigure -backend-config=config/uat/backend.conf &&
terraform validate &&
terraform apply -var-file=./config/uat/env.tfvars