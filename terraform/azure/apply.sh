#!/bin/bash
mkdir -p /workspace
cd /workspace
cp -r %system.teamcity.build.checkoutDir%/terraform/azure .
cd azure
export LC_ALL=en_US.UTF-8
az login --service-principal -u %TEAMCITY_USER% -p %TEAMCITY_PASS% --tenant %env.TENANT-ID%
terraform init
terraform plan