provider "azurerm" {
  features {}
}

terraform {

  backend "azurerm" {
    resource_group_name  = "DPSTerraformStore"
    storage_account_name = "esdbdmdecdtfstate"
    container_name       = "oas-unlock-bot-bdm-dev"
    key                  = "terraform.tfstate"
  }  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 2.78"
    }
  }
}