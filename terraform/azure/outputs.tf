output "luis_endpoint" {
  value = azurerm_cognitive_account.luis_oas_unblock.id
}
output "luis_primary_key" {
  sensitive = true
  value = azurerm_cognitive_account.luis_oas_unblock.primary_access_key
}
output "luis_secondary_key" {
  sensitive = true
  value = azurerm_cognitive_account.luis_oas_unblock.secondary_access_key
}