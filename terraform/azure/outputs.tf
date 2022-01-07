output "luis_endpoint" {
  value = "${var.luis_virtual_assistant_endpoint}"
}
output "luis_primary_key" {
  sensitive = true
  value = "${var.luis_virtual_assistant_primary_key}"
}
output "luis_secondary_key" {
  sensitive = true
  value = "${var.luis_virtual_assistant_secondary_key}"
}
