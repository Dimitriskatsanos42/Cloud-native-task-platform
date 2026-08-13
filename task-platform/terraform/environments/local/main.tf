module "kind_cluster" {
  source       = "../../modules/kind-cluster"
  cluster_name = var.cluster_name
}
