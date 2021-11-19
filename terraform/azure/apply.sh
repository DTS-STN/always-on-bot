#!/bin/bash
mkdir -p /workspace
cd /workspace
cp -r $WORKSPACE/terraform/azure .
cd azure
echo $ARM_CLIENT_ID
echo $ARM_CLIENT_SECRET
echo $ARM_SUBSCRIPTION_ID
echo $ARM_TENANT_ID
terraform init
terraform plan