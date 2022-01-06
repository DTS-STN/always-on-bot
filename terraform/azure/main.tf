resource "azurerm_resource_group" "virtual_assistant_luis" {
  name     = "${var.resource_group_name}"
  location = "${var.location}"
}

#LUIS
resource "azurerm_cognitive_account" "luis_virtual_assistant" {
  name                = "${var.luis_instance_name}"
  location            = "${var.luis_virtual_assistant_location}"
  resource_group_name = "${var.resource_group_name}"
  kind                = "LUIS"

  sku_name = var.luis_sku_name
  tags = {
  "Environment" = "Dev"
  "CostCenter" = "ML/AI"
  }
}

resource "azurerm_cognitive_account" "luis_virtual_assistant_authoring" {
  name                = "${var.luis_authoring_instance_name}"
  location            = "${var.luis_virtual_assistant_authoring_location}"
  resource_group_name = "${var.resource_group_name}"
  kind                = "LUIS.Authoring"
  #Authoring only has one SKU tier
  sku_name = "F0"
}