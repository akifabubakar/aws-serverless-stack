terraform init -reconfigure -backend-config=config/dev/backend.conf &&
terraform validate &&
terraform apply -var-file=./config/dev/env.tfvars