#!/bin/bash
export ARM_CLIENT_ID=$(az keyvault secret show --vault-name bdmDevDPSKeyVault --name bdm-dev-decd-always-on-bot-appid --query value -otsv)
export ARM_CLIENT_SECRET=$(az keyvault secret show --vault-name bdmDevDPSKeyVault --name bdm-dev-decd-always-on-bot-password --query value -otsv)
export ARM_SUBSCRIPTION_ID=$(az keyvault secret show --vault-name bdmDevDPSKeyVault --name bdm-dev-subscription-id --query value -otsv)
export ARM_TENANT_ID=$(az keyvault secret show --vault-name bdmDevDPSKeyVault --name bdm-dev-tenant-id --query value -otsv)
export TF_VAR_luis_instance_name="virtual-assistant-luis"
export TF_VAR_luis_authoring_instance_name="virtualassistantluisbdmdev.Authoring"
export TF_VAR_luis_sku_name="S0"
export TF_VAR_location="westus"
export TF_VAR_resource_group_name="virtual-assistant-dev"