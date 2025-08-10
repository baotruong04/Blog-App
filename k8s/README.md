# Kubernetes Manifests - Phase 2

## 🎯 Overview
Phase 2 implements Kubernetes deployment manifests with comprehensive health probes for both server and client components.

## 📁 Structure
```
k8s/
├── namespace.yaml           # Namespace definitions (prod & dev)
├── configmap.yaml          # Configuration data
├── secrets.yaml            # Sensitive data (base64 encoded)
├── server-deployment.yaml  # Server deployment with health probes
├── server-service.yaml     # Server service definitions
├── client-deployment.yaml  # Client deployment with health probes  
├── client-service.yaml     # Client service definitions
└── ingress.yaml            # Ingress routing configuration

scripts/
├── k8s-deploy.sh           # Deployment script
└── k8s-health-check.sh     # Health monitoring script
```

## 🏥 Health Probes Implementation

### Server Health Probes
- **Liveness Probe**: `/api/health` endpoint
  - Initial delay: 30s, Period: 10s, Timeout: 5s
- **Readiness Probe**: `/api/ready` endpoint  
  - Initial delay: 5s, Period: 5s, Timeout: 3s
- **Startup Probe**: `/api/health` endpoint
  - Initial delay: 10s, Period: 5s, Failure threshold: 12

### Client Health Probes  
- **Liveness Probe**: `/` root path
  - Initial delay: 30s, Period: 10s, Timeout: 5s
- **Readiness Probe**: `/` root path
  - Initial delay: 5s, Period: 5s, Timeout: 3s
- **Startup Probe**: `/` root path
  - Initial delay: 10s, Period: 5s, Failure threshold: 12

## 🚀 Deployment Guide

### Prerequisites
1. **kubectl** installed and configured
2. **Kubernetes cluster** access (EKS, local, etc.)
3. **Docker images** built for server and client
4. **Cluster permissions** for deployments

### Step 1: Validate Cluster Connection
```bash
kubectl cluster-info
kubectl get nodes
```

### Step 2: Deploy Application
```bash
# Deploy to production namespace
./scripts/k8s-deploy.sh blog-app production

# Deploy to development namespace  
./scripts/k8s-deploy.sh blog-app-dev development
```

### Step 3: Monitor Health
```bash
# Check overall health
./scripts/k8s-health-check.sh blog-app

# Watch pod status
kubectl get pods -n blog-app -w
```

## 🔧 Configuration

### Environment Variables (ConfigMap)
- `NODE_ENV`: Environment setting
- `PORT`: Application port  
- `DB_HOST`, `DB_PORT`: Database connection
- `REACT_APP_API_URL`: API endpoint for frontend

### Secrets (Base64 Encoded)
- `MONGO_URI`: Database connection string
- `JWT_SECRET`: JWT signing key
- `SESSION_SECRET`: Session encryption key

### Resource Limits
**Server:**
- Requests: 128Mi memory, 100m CPU
- Limits: 512Mi memory, 500m CPU

**Client:**
- Requests: 64Mi memory, 50m CPU  
- Limits: 256Mi memory, 200m CPU

## 🔒 Security Features

### Pod Security Context
- `runAsNonRoot: true`
- `runAsUser: 1000` (server), `101` (client/nginx)
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`
- Capabilities dropped: `ALL`

### Network Policies
- ClusterIP services for internal communication
- LoadBalancer services for external access
- Ingress with ALB annotations for AWS

## 📊 Monitoring & Observability

### Prometheus Integration
- Metrics endpoints exposed
- Pod annotations for scraping
- Resource usage monitoring

### Health Check Endpoints
Server should implement:
```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness check endpoint  
app.get('/api/ready', (req, res) => {
  // Check database connection, external dependencies
  if (isReady()) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});
```

## 🛠️ Troubleshooting

### Common Issues

**Pods Not Starting:**
```bash
kubectl describe pod <pod-name> -n blog-app
kubectl logs <pod-name> -n blog-app
```

**Health Probes Failing:**
```bash
# Check probe configuration
kubectl get pod <pod-name> -n blog-app -o yaml

# Test health endpoint manually
kubectl port-forward <pod-name> 5000:5000 -n blog-app
curl http://localhost:5000/api/health
```

**Service Not Accessible:**
```bash
kubectl get endpoints -n blog-app
kubectl get services -n blog-app
```

### Debugging Commands
```bash
# Get all resources
kubectl get all -n blog-app

# Check events
kubectl get events -n blog-app --sort-by='.lastTimestamp'

# Pod shell access
kubectl exec -it <pod-name> -n blog-app -- /bin/sh

# Port forwarding for local testing
kubectl port-forward service/blog-server 5000:5000 -n blog-app
kubectl port-forward service/blog-client 8080:80 -n blog-app
```

## 🔄 Rolling Updates

### Update Strategy
- **RollingUpdate** with `maxSurge: 1`, `maxUnavailable: 0` (server)
- **RollingUpdate** with `maxSurge: 1`, `maxUnavailable: 1` (client)

### Deployment Commands
```bash
# Update image
kubectl set image deployment/blog-server server=blog-app/server:v2 -n blog-app

# Check rollout status
kubectl rollout status deployment/blog-server -n blog-app

# Rollback if needed
kubectl rollout undo deployment/blog-server -n blog-app
```

## 📋 Next Steps (Phase 3)

1. **Helm Chart Creation**: Convert manifests to Helm templates
2. **Multi-environment Configuration**: Values files for dev/staging/prod
3. **Pipeline Integration**: Automated deployment via Azure DevOps
4. **Advanced Monitoring**: Grafana dashboards, alerting rules

## 🔗 Useful Links

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Health Checks Best Practices](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Prometheus Kubernetes](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config)
