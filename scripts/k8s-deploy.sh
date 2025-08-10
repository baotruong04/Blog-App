#!/bin/bash

# Kubernetes Deployment Script for Blog-App
# Usage: ./scripts/k8s-deploy.sh [namespace] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${1:-blog-app}
ENVIRONMENT=${2:-production}
K8S_DIR="./k8s"

echo -e "${PURPLE}🚀 Blog-App Kubernetes Deployment${NC}"
echo -e "${PURPLE}==================================${NC}"
echo ""

# Validate kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check cluster connection
echo -e "${BLUE}🔍 Checking Kubernetes cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    echo -e "${YELLOW}💡 Please ensure your kubeconfig is set up correctly${NC}"
    exit 1
fi

CLUSTER_INFO=$(kubectl cluster-info | head -1)
echo -e "${GREEN}✅ Connected to: ${CLUSTER_INFO}${NC}"
echo ""

# Validate manifests
echo -e "${BLUE}📋 Validating Kubernetes manifests...${NC}"
MANIFESTS=(
    "namespace.yaml"
    "configmap.yaml" 
    "secrets.yaml"
    "server-deployment.yaml"
    "server-service.yaml"
    "client-deployment.yaml"
    "client-service.yaml"
)

for manifest in "${MANIFESTS[@]}"; do
    if [ ! -f "$K8S_DIR/$manifest" ]; then
        echo -e "${RED}❌ Missing manifest: $K8S_DIR/$manifest${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}  📄 Validating $manifest...${NC}"
    if kubectl apply --dry-run=client -f "$K8S_DIR/$manifest" &> /dev/null; then
        echo -e "${GREEN}  ✅ $manifest is valid${NC}"
    else
        echo -e "${RED}  ❌ $manifest has validation errors${NC}"
        kubectl apply --dry-run=client -f "$K8S_DIR/$manifest"
        exit 1
    fi
done

echo ""

# Deploy manifests
echo -e "${BLUE}🚀 Deploying to namespace: $NAMESPACE${NC}"
echo -e "${BLUE}🌍 Environment: $ENVIRONMENT${NC}"
echo ""

# Create namespace first
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl apply -f "$K8S_DIR/namespace.yaml"

# Apply configurations
echo -e "${YELLOW}⚙️ Applying configurations...${NC}"
kubectl apply -f "$K8S_DIR/configmap.yaml"
kubectl apply -f "$K8S_DIR/secrets.yaml"

# Deploy applications
echo -e "${YELLOW}🖥️ Deploying server...${NC}"
kubectl apply -f "$K8S_DIR/server-deployment.yaml"
kubectl apply -f "$K8S_DIR/server-service.yaml"

echo -e "${YELLOW}💻 Deploying client...${NC}"
kubectl apply -f "$K8S_DIR/client-deployment.yaml"
kubectl apply -f "$K8S_DIR/client-service.yaml"

# Optional: Deploy ingress
if [ -f "$K8S_DIR/ingress.yaml" ]; then
    echo -e "${YELLOW}🌐 Deploying ingress...${NC}"
    kubectl apply -f "$K8S_DIR/ingress.yaml"
fi

echo ""

# Wait for deployments
echo -e "${BLUE}⏳ Waiting for deployments to be ready...${NC}"
echo -e "${YELLOW}  🖥️ Waiting for server deployment...${NC}"
kubectl rollout status deployment/blog-server -n $NAMESPACE --timeout=300s

echo -e "${YELLOW}  💻 Waiting for client deployment...${NC}"
kubectl rollout status deployment/blog-client -n $NAMESPACE --timeout=300s

echo ""

# Show deployment status
echo -e "${BLUE}📊 Deployment Status${NC}"
echo -e "${BLUE}====================${NC}"

echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n $NAMESPACE -l app=blog-app

echo ""
echo -e "${YELLOW}Services:${NC}"
kubectl get services -n $NAMESPACE -l app=blog-app

echo ""
echo -e "${YELLOW}Deployments:${NC}"
kubectl get deployments -n $NAMESPACE -l app=blog-app

# Health check
echo ""
echo -e "${BLUE}🏥 Health Check${NC}"
echo -e "${BLUE}===============${NC}"

# Check pod health
SERVER_POD=$(kubectl get pods -n $NAMESPACE -l component=server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
CLIENT_POD=$(kubectl get pods -n $NAMESPACE -l component=client -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ ! -z "$SERVER_POD" ]; then
    echo -e "${YELLOW}🖥️ Server pod health: $SERVER_POD${NC}"
    kubectl get pod $SERVER_POD -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q True && echo -e "${GREEN}  ✅ Ready${NC}" || echo -e "${RED}  ❌ Not Ready${NC}"
fi

if [ ! -z "$CLIENT_POD" ]; then
    echo -e "${YELLOW}💻 Client pod health: $CLIENT_POD${NC}"
    kubectl get pod $CLIENT_POD -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q True && echo -e "${GREEN}  ✅ Ready${NC}" || echo -e "${RED}  ❌ Not Ready${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""

# Show next steps
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo -e "${YELLOW}1. Check pod logs:${NC}"
echo "   kubectl logs -f deployment/blog-server -n $NAMESPACE"
echo "   kubectl logs -f deployment/blog-client -n $NAMESPACE"
echo ""
echo -e "${YELLOW}2. Port forward to test locally:${NC}"
echo "   kubectl port-forward service/blog-client 8080:80 -n $NAMESPACE"
echo "   kubectl port-forward service/blog-server 5000:5000 -n $NAMESPACE"
echo ""
echo -e "${YELLOW}3. Get service URLs:${NC}"
echo "   kubectl get services -n $NAMESPACE"
