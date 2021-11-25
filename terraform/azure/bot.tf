data "azurerm_client_config" "current" {}

resource "azurerm_bot_channels_registration" "oas_unblock_bot_bdm_dev" {
  name                = "oas_unblock_bot_bdm_dev"
  location            = "global"
  resource_group_name = azurerm_resource_group.oas_unblock_luis.name
  sku                 = "F0"
  microsoft_app_id    = "1263a42b-f5c3-4060-86f2-05a8245e7f01"
}
