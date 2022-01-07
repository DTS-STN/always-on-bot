# provider keeps the state of all the azure resources
# resource_group_name and storage_account_name are managed by SRE team (TODO Ben, confirm this is best).
# container_name needs to be precreated for this to work (ask Admin or SRE team)

provider "azurerm" {
  features {}
}

terraform {

  backend "azurerm" {
    resource_group_name  = "DPSTerraformStore"
    storage_account_name = "esdbdmdecdtfstate"
    container_name       = "always-on-bot-bdm-dev"
    key                  = "terraform.tfstate"
  }
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 2.78"
    }
  }
}
