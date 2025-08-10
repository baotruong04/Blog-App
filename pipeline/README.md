# Azure DevOps Pipeline Documentation

## 🚀 Pipeline Overview

This Azure DevOps pipeline implements a secure CI/CD workflow for the Blog-App MERN stack application with integrated security scanning, containerization, and Kubernetes deployment.

## 📋 Pipeline Structure

```
azure-pipelines.yml                 # Main pipeline definition
pipeline/
├── variables/
│   ├── common.yml                  # Shared variables
│   ├── dev.yml                     # Development environment
│   └── prod.yml                    # Production environment
├── build-stage.yml                 # Build and security scanning
├── deploy-stage.yml                # Kubernetes deployment
└── security-stage.yml              # Advanced security analysis
```

## 🔄 Pipeline Stages

### Stage 1: Build & Security Scan
- **Secret Detection**: GitLeaks + Trivy secret scanning
- **Vulnerability Analysis**: Trivy filesystem and dependency scanning
- **Unit Testing**: Server and client test execution
- **Docker Build**: Multi-stage container builds
- **Image Scanning**: Trivy container image analysis

### Stage 2: Deploy Development (Auto)
- **Trigger**: Automatic on `develop` branch
- **Environment**: `blog-app-dev` namespace
- **Configuration**: Development values (`values-dev.yaml`)
- **Resources**: Lower resource allocation

### Stage 3: Deploy Production (Manual)
- **Trigger**: Manual approval on `main` branch
- **Environment**: `blog-app` namespace
- **Configuration**: Production values (`values-prod.yaml`)
- **Resources**: High availability configuration

## 🛡️ Security Features

### Multi-Layer Security Scanning
1. **Secret Detection**
   - GitLeaks with custom rules
   - Trivy secret scanning
   - Custom regex patterns

2. **Vulnerability Analysis**
   - Filesystem scanning
   - Dependency auditing (npm audit)
   - Container image scanning
   - Infrastructure-as-Code scanning

3. **Compliance Checks**
   - Dockerfile security baseline
   - Kubernetes manifest validation
   - Helm chart security analysis

### Security Gates
- **Development**: Warnings logged, build continues
- **Production**: Critical findings block deployment
- **Configurable**: Security thresholds via variables

## ☸️ Kubernetes Deployment

### Helm-Based Deployment
- **Charts**: Located in `helm/blog-app/`
- **Multi-Environment**: Dev, staging, production configs
- **Health Checks**: Readiness and liveness probes
- **Rolling Updates**: Zero-downtime deployments
- **Rollback**: Automatic rollback on failure

### Infrastructure Components
- **Namespace**: Environment isolation
- **ConfigMaps**: Application configuration
- **Secrets**: Secure credential management
- **Services**: Network exposure
- **Ingress**: External traffic routing

## 🔧 Prerequisites

### Azure DevOps Setup
1. **Service Connections**
   - `aws-ecr-connection`: AWS ECR registry access
   - `eks-cluster-connection`: EKS cluster access

2. **Variable Groups**
   - `AWS_ACCOUNT_ID`: AWS account identifier
   - `AWS_REGION`: AWS region (e.g., us-west-2)

3. **Environments**
   - `blog-app-development`: Development environment
   - `blog-app-production`: Production environment (with approvals)

### EKS Cluster Setup
1. **Self-Hosted Agents**
   - Pool name: `eks-agents`
   - Running on EKS cluster
   - Docker and Helm pre-installed

2. **RBAC Configuration**
   - Service account with deployment permissions
   - Namespace-scoped access controls

### AWS ECR Setup
1. **Repository Creation**
   - `blog-app/server`: Server container images
   - `blog-app/client`: Client container images

2. **IAM Permissions**
   - ECR push/pull permissions
   - EKS cluster access

## 🚀 Usage Guide

### Triggering Builds

**Development Deployment:**
```bash
git push origin develop
```
- Automatically triggers build and development deployment

**Production Deployment:**
```bash
git push origin main
```
- Triggers build and waits for manual approval for production

### Manual Pipeline Run
1. Navigate to Azure DevOps Pipeline
2. Click "Run pipeline"
3. Select branch and parameters
4. Monitor execution in real-time

### Monitoring Deployments
- **Azure DevOps**: Pipeline execution logs
- **Kubernetes**: `kubectl get pods -n <namespace>`
- **Helm**: `helm status blog-app -n <namespace>`

## 📊 Artifacts and Reports

### Security Reports
- **GitLeaks**: Secret detection results
- **Trivy**: Vulnerability and misconfiguration reports
- **Security Dashboard**: HTML comprehensive report

### Deployment Reports
- **Helm Status**: Release information
- **Pod Status**: Kubernetes resource health
- **Health Checks**: Application readiness

### Test Results
- **Unit Tests**: Server and client test execution
- **Security Tests**: Compliance and vulnerability results
- **Integration Tests**: End-to-end validation

## 🔍 Troubleshooting

### Common Issues

**Security Scan Failures:**
```yaml
# Disable security gates temporarily
securityScanFailBuild: false
```

**Image Pull Errors:**
- Verify ECR service connection
- Check IAM permissions
- Validate image tags

**Deployment Failures:**
- Review Kubernetes events: `kubectl describe pod <pod-name>`
- Check Helm release: `helm status blog-app`
- Verify resource quotas and limits

### Debug Commands
```bash
# Check pipeline variables
echo $(containerRegistry)
echo $(Build.BuildNumber)

# Verify Kubernetes connectivity
kubectl cluster-info
kubectl get nodes

# Test Helm chart locally
helm template blog-app ./helm/blog-app --values ./helm/blog-app/values-dev.yaml
```

## 🔄 Customization

### Adding New Environments
1. Create `pipeline/variables/<env>.yml`
2. Add environment to Azure DevOps
3. Update `azure-pipelines.yml` with new stage

### Custom Security Rules
1. Update `security/gitleaks-config.toml`
2. Modify `security/trivy-config.yaml`
3. Add custom scanning steps to `build-stage.yml`

### Scaling Configuration
- Modify `values-prod.yaml` for resource adjustments
- Update autoscaling settings in Helm values
- Configure horizontal pod autoscaling

## 📚 References

- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)
- [GitLeaks Secret Detection](https://github.com/zricethezav/gitleaks)
