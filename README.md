# Cloud-Native Task Management Platform

Μια σκόπιμα απλή εφαρμογή διαχείρισης εργασιών (React + Express + PostgreSQL) που χρησιμοποιείται
ως όχημα για να αναδείξει ένα ρεαλιστικό DevOps/platform toolchain: Terraform, Kubernetes, Docker,
Helm, GitHub Actions CI/CD, monitoring με Prometheus/Grafana, και security hardening σε Kubernetes.

Η λογική της εφαρμογής είναι σκόπιμα ελάχιστη — η υποδομή είναι το ζητούμενο.

## Αρχιτεκτονική

```
Developer → Git → Docker → Kubernetes (kind, τοπικά) → Frontend / Backend / PostgreSQL
                                     │
                          Ingress (nginx) δρομολογεί:
                          /api/*  → backend Service (Express)
                          /*      → frontend Service (nginx σερβίρει το React build)
```

- **Frontend**: React (Vite), χτισμένο σε static assets, σερβίρεται από nginx.
- **Backend**: Express REST API (`/api/tasks`), επικοινωνεί με PostgreSQL μέσω `pg`.
- **Database**: PostgreSQL, deployed ως StatefulSet με PersistentVolumeClaim.
- **Cluster**: τοπικό `kind` cluster, δημιουργείται από Terraform.
- **Packaging**: raw manifests στο `kubernetes/` για εκμάθηση, `helm/task-platform` για
  την παραμετροποιημένη, επαναχρησιμοποιήσιμη έκδοση που χρησιμοποιείται στο CI/CD.

## Τεχνολογίες

Terraform · Kubernetes · Docker · Helm · GitHub Actions · PostgreSQL · Prometheus · Grafana

## Δομή repository

```
task-platform/
├── app/
│   ├── backend/        # Express REST API
│   └── frontend/       # React + Vite SPA
├── terraform/
│   ├── modules/kind-cluster/   # επαναχρησιμοποιήσιμο module: δημιουργεί το kind cluster
│   └── environments/local/     # root module για το τοπικό environment
├── kubernetes/          # raw manifests (namespace, postgres, backend, frontend, ingress, netpol)
├── helm/task-platform/  # Helm chart έκδοση των παραπάνω, με values-dev/prod
├── .github/workflows/   # ci-cd.yaml (εφαρμογή) + terraform.yaml (μόνο plan)
├── monitoring/           # kube-prometheus-stack values + Grafana dashboard JSON
├── tests/                # backend smoke tests
└── README.md
```

## Προαπαιτούμενα

- Docker
- kind (ή minikube) + kubectl
- Terraform >= 1.6
- Helm >= 3.12
- Node.js 20 LTS
- Git

## Τοπική εγκατάσταση

### 1. Δημιουργία cluster με Terraform

```bash
cd terraform/environments/local
terraform init
terraform plan
terraform apply
```

Αυτό δημιουργεί ένα τοπικό `kind` cluster με όνομα `taskapp`, με έναν control-plane κόμβο
και έναν worker κόμβο, με τις θύρες 8080/8443 mapped στο host για πρόσβαση μέσω Ingress.

### 2. Εγκατάσταση Ingress controller

Το cluster χρειάζεται ingress controller για να δρομολογεί κίνηση· το kind δεν έχει ένα
built-in εξ ορισμού.

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

### 3. Build των images της εφαρμογής

```bash
docker build -t task-platform-backend:local ./app/backend
docker build -t task-platform-frontend:local ./app/frontend
kind load docker-image task-platform-backend:local --name taskapp
kind load docker-image task-platform-frontend:local --name taskapp
```

Το `kind load` είναι απαραίτητο γιατί ένα kind cluster δεν μπορεί να κάνει pull από τον
τοπικό σου Docker daemon — τα images πρέπει να φορτωθούν ρητά μέσα στο εσωτερικό
registry του cluster.

### 4. Deploy με kubectl (raw manifests) — για εκμάθηση

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/postgres/
kubectl apply -f kubernetes/backend/
kubectl apply -f kubernetes/frontend/
kubectl apply -f kubernetes/ingress.yaml
kubectl apply -f kubernetes/network-policy.yaml
```

### 4β. Ή deploy με Helm — για επαναχρησιμοποιήσιμη χρήση/CI

```bash
helm upgrade --install task-platform ./helm/task-platform \
  --namespace taskapp --create-namespace \
  -f ./helm/task-platform/values-dev.yaml \
  --set database.password=changeme-local-dev
```

### 5. Επαλήθευση

```bash
kubectl get pods -n taskapp
kubectl get ingress -n taskapp
curl http://localhost:8080/api/tasks
```

Άνοιξε το `http://localhost:8080` σε browser για να χρησιμοποιήσεις την εφαρμογή.

## Terraform εντολές αναφοράς

| Εντολή | Σκοπός |
|---|---|
| `terraform init` | Κατεβάζει providers, στήνει το backend |
| `terraform plan` | Δείχνει τι θα άλλαζε, χωρίς να το εφαρμόζει |
| `terraform apply` | Εφαρμόζει το plan |
| `terraform destroy` | Καταστρέφει το kind cluster |
| `terraform fmt -recursive` | Κανονικοποιεί τη μορφοποίηση |
| `terraform validate` | Ελέγχει σύνταξη/εσωτερική συνέπεια |

## Kubernetes εντολές αναφοράς

| Εντολή | Σκοπός |
|---|---|
| `kubectl get pods -n taskapp` | Λίστα pods και κατάστασης |
| `kubectl logs -n taskapp deploy/backend` | Logs του backend |
| `kubectl describe pod <name> -n taskapp` | Debug συγκεκριμένου pod |
| `kubectl port-forward -n taskapp svc/backend 3000:3000` | Άμεση πρόσβαση παρακάμπτοντας το Ingress |

## Helm εντολές αναφοράς

| Εντολή | Σκοπός |
|---|---|
| `helm install ...` | Πρώτη εγκατάσταση |
| `helm upgrade --install ...` | Εγκατάσταση ή ενημέρωση, idempotent |
| `helm uninstall task-platform -n taskapp` | Αφαίρεση του release |
| `helm template ./helm/task-platform` | Rendering manifests τοπικά χωρίς apply (χρήσιμο για review) |
| `helm lint ./helm/task-platform` | Επικύρωση του chart |

## CI/CD

- **`ci-cd.yaml`**: σε κάθε push στο `main`, τρέχει backend tests → κάνει build & push τα
  Docker images στο GHCR → (ενδεικτικά) κάνει deploy μέσω Helm. Τα pull requests τρέχουν
  μόνο tests, χωρίς push image.
- **`terraform.yaml`**: τρέχει `fmt`, `validate`, και `plan` σε κάθε PR που αγγίζει το
  `terraform/`. **Το `apply` δεν τρέχει ποτέ αυτόματα** — οι αλλαγές υποδομής απαιτούν
  έναν άνθρωπο να κάνει review το plan και να το εφαρμόσει σκόπιμα, καθώς ένα κακό
  αυτόματο apply σε ένα PR που δεν έχει γίνει review θα μπορούσε να βλάψει πραγματική υποδομή.

## Monitoring

Το `kube-prometheus-stack` (μέσω του `monitoring/prometheus-values.yaml`) παρέχει
Prometheus + Grafana + Alertmanager. Εγκατέστησέ το ξεχωριστά αφού τρέχει η εφαρμογή:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f monitoring/prometheus-values.yaml
```

Κάνε import το `monitoring/grafana-dashboard.json` στο Grafana για μια γρήγορη εικόνα
CPU/μνήμης pod, restarts, και readiness.

## Αποφάσεις ασφάλειας

- **Non-root containers**: και τα δύο images της εφαρμογής δημιουργούν και τρέχουν σαν
  μη-προνομιούχος χρήστης· το `securityContext.runAsNonRoot: true` του K8s το **επιβάλλει**
  επιπλέον σε επίπεδο cluster.
- **Read-only root filesystem**: `readOnlyRootFilesystem: true` και στα δύο app containers —
  το nginx χρειάζεται εγγράψιμα `/var/cache/nginx` και `/var/run`, τα οποία παρέχονται
  μέσω `emptyDir` volumes αντί για εγγράψιμο root filesystem.
- **Dropped capabilities**: το `capabilities.drop: ["ALL"]` αφαιρεί Linux capabilities που
  κανένα container δεν χρειάζεται.
- **NetworkPolicies**: default-deny ingress ανά namespace, μετά ρητές επιτρεπόμενες
  συνδέσεις (backend → postgres, ingress-controller → frontend/backend). Περιορίζει την
  πλευρική κίνηση σε περίπτωση που κάποιο pod παραβιαστεί.
- **Secrets vs ConfigMaps**: τα passwords ζουν σε `Secret` objects, ποτέ σε `ConfigMap` ή
  σκέτες τιμές env σε manifests που γίνονται commit στο git (το `values.yaml` αφήνει σκόπιμα
  κενό το `database.password` — πέρασέ το μέσω `--set` ή ενός untracked αρχείου).
- **Resource requests/limits**: αποτρέπει ένα pod που "τρέχει ανεξέλεγκτα" να στερήσει
  πόρους από άλλα στον ίδιο κόμβο.
- **Minimal images**: `alpine`-based images και στα δύο app containers για μικρότερη
  επιφάνεια επίθεσης.

## Cloud deployment (Phase 8 — δεν έχει χτιστεί ακόμα)

Η τοπική αρχιτεκτονική αντιστοιχίζεται στο cloud ως εξής μόλις είσαι έτοιμος να την επεκτείνεις:

- `kind` cluster → managed Kubernetes (EKS/GKE/AKS), δημιουργείται από νέο Terraform module.
- Τοπικό StatefulSet Postgres → managed database (RDS/Cloud SQL) *ή* παραμονή in-cluster,
  ανάλογα με το trade-off κόστους/λειτουργίας (να συζητηθεί πριν την υλοποίηση — έχει
  πραγματικές επιπτώσεις στο κόστος).
- Το ίδιο Helm chart, διαφορετικό `values-prod.yaml` και registry εικόνων.
- Remote state backend για το Terraform (S3+DynamoDB ή αντίστοιχο) αντικαθιστά το τοπικό state.

## Αντιμετώπιση προβλημάτων

| Σύμπτωμα | Πιθανή αιτία | Λύση |
|---|---|---|
| `ImagePullBackOff` | Το image χτίστηκε τοπικά αλλά δεν φορτώθηκε στο kind | `kind load docker-image <image> --name taskapp` |
| Backend `CrashLoopBackOff` | Η DB δεν είναι έτοιμη ακόμα / λάθος `DB_HOST` | `kubectl logs -n taskapp deploy/backend`· επιβεβαίωσε ότι το Service/StatefulSet του `postgres` είναι Ready πρώτα |
| Το Ingress επιστρέφει 404 | Δεν έχει εγκατασταθεί ingress controller, ή mismatch στο class | `kubectl get pods -n ingress-nginx`· επιβεβαίωσε ότι το `ingressClassName: nginx` ταιριάζει |
| Το `terraform apply` αποτυγχάνει να δημιουργήσει το cluster | Ο Docker δεν τρέχει / όρια πόρων στο WSL2 | Βεβαιώσου ότι τρέχει το Docker Desktop· έλεγξε την κατανομή μνήμης στο `.wslconfig` |
| Το Helm install αποτυγχάνει σε υπάρχοντα αντικείμενα namespace | Το namespace/αντικείμενα έχουν ήδη εφαρμοστεί μέσω raw `kubectl apply` | `kubectl delete -f kubernetes/` πρώτα, ή επίλεξε μία μέθοδο deployment κάθε φορά |

