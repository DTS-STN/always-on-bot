data "azurerm_client_config" "current" {}

resource "azurerm_bot_channels_registration" "oas_unblock_bot_bdm_dev" {
  name                = "oas_unblock_bot_bdm_dev"
  location            = "global"
  resource_group_name = azurerm_resource_group.oas_unblock_luis.name
  sku                 = "F0"
  microsoft_app_id    = "${data.azurerm_client_config.current.client_id}"
}
