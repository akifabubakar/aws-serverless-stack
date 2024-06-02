terraform init -reconfigure -backend-config=config/dev/backend.conf &&
terraform validate &&
terraform apply -destroy -var-file=./config/dev/env.tfvars