provider "azurerm" {
  features {}
}

terraform {

  backend "azurerm" {
    resource_group_name  = "DPSTerraformStore"
    storage_account_name = "esdbdmdecdtfstate"
    container_name       = "oas-unblock-bot-bdm-dev"
    key                  = "terraform.tfstate"
  }  
}
