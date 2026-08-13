terraform {
  required_version = ">= 1.6.0"
  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.5"
    }
  }

  # Local state for now (fine for a solo local environment).
  # In Phase 8 (cloud) this becomes a remote backend (e.g. S3 + DynamoDB lock,
  # or Terraform Cloud) so state is shared and locked across team members/CI.
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "kind" {}
