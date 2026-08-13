variable "cluster_name" {
  description = "Name of the kind cluster"
  type        = string
  default     = "taskapp"
}

variable "node_image" {
  description = "kind node image (controls Kubernetes version)"
  type        = string
  default     = "kindest/node:v1.30.0"
}
