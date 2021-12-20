output "luis_endpoint" {
  value = azurerm_cognitive_account.virtual_assistant_luis.id
}
output "luis_primary_key" {
  sensitive = true
  value = azurerm_cognitive_account.virtual_assistant_luis.primary_access_key
}
output "luis_secondary_key" {
  sensitive = true
  value = azurerm_cognitive_account.virtual_assistant_luis.secondary_access_key
}