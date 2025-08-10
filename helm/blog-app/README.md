# Blog-App Helm Chart

A Helm chart for deploying the Blog-App MERN stack application with security best practices.

## 🚀 Quick Start

### Prerequisites
- Kubernetes 1.18+
- Helm 3.0+
- kubectl configured to communicate with your cluster

### Install the Chart

```bash
# Add custom values
helm install blog-app ./helm/blog-app \
  --values ./helm/blog-app/values-dev.yaml \
  --namespace blog-app-dev \
  --create-namespace

# Or for production
helm install blog-app ./helm/blog-app \
  --values ./helm/blog-app/values-prod.yaml \
  --namespace blog-app \
  --create-namespace
```

### Upgrade the Chart

```bash
helm upgrade blog-app ./helm/blog-app \
  --values ./helm/blog-app/values-dev.yaml \
  --namespace blog-app-dev
```

### Uninstall the Chart

```bash
helm uninstall blog-app --namespace blog-app-dev
```

## 📁 Chart Structure

```
helm/blog-app/
├── Chart.yaml                    # Chart metadata
├── values.yaml                   # Default values
├── values-dev.yaml               # Development environment values  
├── values-prod.yaml              # Production environment values
├── values-original.yaml          # Original Helm template values
├── values-custom.yaml            # Custom base values
└── templates/
    ├── namespace.yaml            # Namespace creation
    ├── configmap.yaml            # Application configuration
    ├── secrets.yaml              # Secret management
    ├── server-deployment.yaml    # Backend deployment
    ├── server-service.yaml       # Backend service
    ├── client-deployment.yaml    # Frontend deployment
    ├── client-service.yaml       # Frontend service
    ├── ingress.yaml              # Ingress configuration
    ├── serviceaccount.yaml       # Service account
    ├── _helpers.tpl              # Template helpers
    └── tests/
        └── test-connection.yaml  # Connection tests
```

## ⚙️ Configuration

### Key Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `namespace.name` | Kubernetes namespace | `blog-app` |
| `server.replicaCount` | Number of server replicas | `2` |
| `client.replicaCount` | Number of client replicas | `2` |
| `server.image.repository` | Server image repository | `blog-server` |
| `client.image.repository` | Client image repository | `blog-client` |
| `server.image.tag` | Server image tag | `latest` |
| `client.image.tag` | Client image tag | `latest` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `nginx` |

### Environment-Specific Configurations

#### Development (`values-dev.yaml`)
- Single replica for faster development
- Debug logging enabled
- Relaxed security policies
- Local domain: `blog-app-dev.local`

#### Production (`values-prod.yaml`)
- Multiple replicas for high availability
- Strict security policies
- SSL/TLS enabled
- Resource limits enforced
- Autoscaling enabled

## 🏥 Health Checks

### Server Health Probes
- **Liveness Probe**: `GET /api/health`
- **Readiness Probe**: `GET /api/ready`

### Client Health Probes
- **Liveness Probe**: `GET /`
- **Readiness Probe**: `GET /`

## 🔒 Security Features

### Pod Security
- Non-root containers
- Read-only root filesystem
- Security contexts applied
- Resource limits enforced

### Network Security
- Network policies (configurable)
- Ingress with SSL/TLS
- Service mesh ready

### Secret Management
- Kubernetes secrets for sensitive data
- Base64 encoded values
- External secret management support

## 📊 Monitoring

### Metrics Collection
- Prometheus annotations
- Health check endpoints
- Application-specific metrics

### Logging
- Structured logging
- Configurable log levels
- Container log aggregation

## 🔧 Development Workflow

### Local Testing
```bash
# Lint the chart
helm lint ./helm/blog-app

# Template rendering
helm template blog-app ./helm/blog-app \
  --values ./helm/blog-app/values-dev.yaml

# Dry run installation
helm install blog-app ./helm/blog-app \
  --values ./helm/blog-app/values-dev.yaml \
  --dry-run --debug
```

### Testing Deployments
```bash
# Install in development
helm install blog-app-dev ./helm/blog-app \
  --values ./helm/blog-app/values-dev.yaml \
  --namespace blog-app-dev \
  --create-namespace

# Run tests
helm test blog-app-dev --namespace blog-app-dev

# Check deployment status
kubectl get all -n blog-app-dev
```

## 🚀 CI/CD Integration

### Azure DevOps Pipeline Integration
```yaml
- task: HelmDeploy@0
  displayName: 'Deploy to Kubernetes'
  inputs:
    command: 'upgrade'
    chartType: 'FilePath'
    chartPath: './helm/blog-app'
    releaseName: 'blog-app'
    namespace: '$(kubernetesNamespace)'
    valueFile: './helm/blog-app/values-$(environment).yaml'
    arguments: '--install --create-namespace'
```

## 🔄 Rollback Strategy

```bash
# View release history
helm history blog-app --namespace blog-app-dev

# Rollback to previous version
helm rollback blog-app 1 --namespace blog-app-dev
```

## 📝 Customization

### Adding Custom Resources
1. Create new template in `templates/` directory
2. Add corresponding values in `values.yaml`
3. Test with `helm template` command

### Environment Variables
Add new environment variables in the values file:

```yaml
server:
  env:
    CUSTOM_VAR: "custom-value"
```

### Resource Limits
Adjust resource limits per environment:

```yaml
server:
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi
```

## 🛠️ Troubleshooting

### Common Issues

1. **Pod not starting**: Check resource limits and image availability
2. **Service unavailable**: Verify health probes and service configuration
3. **Ingress not working**: Check ingress controller and DNS configuration

### Debug Commands
```bash
# Check pod logs
kubectl logs -f deployment/blog-server -n blog-app-dev

# Describe problematic resources
kubectl describe pod <pod-name> -n blog-app-dev

# Check events
kubectl get events -n blog-app-dev --sort-by=.metadata.creationTimestamp
```

## 🤝 Contributing

1. Make changes to templates or values
2. Test with `helm lint` and `helm template`
3. Update documentation
4. Submit pull request

## 📜 License

This Helm chart is part of the Blog-App project and follows the same license terms.
