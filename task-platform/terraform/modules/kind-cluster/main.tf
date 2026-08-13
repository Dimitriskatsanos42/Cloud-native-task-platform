# Manages the kind cluster itself via the tehcyx/kind provider.
# This is the ONLY Terraform-managed thing in Phase 1-3: everything running
# INSIDE the cluster (Deployments, Services...) is applied with kubectl/Helm,
# not Terraform - Terraform's job here is to provide the cluster, not manage
# every workload in it. We revisit this boundary in Phase 8 for cloud.
resource "kind_cluster" "this" {
  name           = var.cluster_name
  node_image     = var.node_image
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"
      extra_port_mappings {
        container_port = 80
        host_port       = 8080
      }
      extra_port_mappings {
        container_port = 443
        host_port       = 8443
      }
    }
    node {
      role = "worker"
    }
  }
}
