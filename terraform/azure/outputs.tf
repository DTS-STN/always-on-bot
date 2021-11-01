output "luis_endpoint" {
  value = azurerm_cognitive_account.luis_oas_callback.id
}
output "luis_primary_key" {
  sensitive = true
  value = azurerm_cognitive_account.luis_oas_callback.primary_access_key 
}
output "luis_secondary_key" {
  sensitive = true
  value = azurerm_cognitive_account.luis_oas_callback.secondary_access_key
}