provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  tenant_id = var.tenant_id
  client_id = var.client_id
  client_secret = var.client_secret
}

terraform {

  backend "azurerm" {
    resource_group_name  = "DPSTerraformStore"
    storage_account_name = "esdbdmdecdtfstate"
    container_name       = "oas-unblock-bot-bdm-dev"
    key                  = "terraform.tfstate"
  }  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 2.78"
    }
  }
}
