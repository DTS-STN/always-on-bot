#!/bin/bash
mkdir -p /workspace
cd /workspace
cp -r $WORKSPACE/terraform/azure .
cd azure
terraform init
terraform apply -auto-approve
