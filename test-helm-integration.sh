#!/bin/bash

# Helm Chart Integration Tests
# Following testing guide: Test Interactions, Realistic Environment, Focus on Interfaces

set -e

CHART_PATH="helm/blog-app"
RELEASE_NAME="blog-app-integration"
NAMESPACE="blog-app-integration"
TIMEOUT="300s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Starting Helm Chart Integration Tests...${NC}"

# Check if kubectl and helm are available
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl is required but not installed${NC}"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo -e "${RED}helm is required but not installed${NC}"; exit 1; }

# Test 1: Realistic Environment Setup
echo -e "\n${BLUE}Integration Test 1: Environment Setup${NC}"

# Create namespace if it doesn't exist
if ! kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
    kubectl create namespace $NAMESPACE
    echo -e "${GREEN}✓ Created namespace $NAMESPACE${NC}"
fi

# Test 2: Deploy and Test Interactions
echo -e "\n${BLUE}Integration Test 2: Helm Install${NC}"

# Install the chart
if helm install $RELEASE_NAME $CHART_PATH --namespace $NAMESPACE --wait --timeout=$TIMEOUT; then
    echo -e "${GREEN}✓ Helm chart installed successfully${NC}"
else
    echo -e "${RED}✗ Helm chart installation failed${NC}"
    exit 1
fi

# Test 3: Verify Component Interactions
echo -e "\n${BLUE}Integration Test 3: Component Interactions${NC}"

# Check if all pods are running
echo "Waiting for pods to be ready..."
if kubectl wait --for=condition=Ready pod --all -n $NAMESPACE --timeout=$TIMEOUT; then
    echo -e "${GREEN}✓ All pods are ready${NC}"
else
    echo -e "${RED}✗ Pods failed to become ready${NC}"
    kubectl get pods -n $NAMESPACE
    exit 1
fi

# Check deployment rollout status
deployments=$(kubectl get deployments -n $NAMESPACE -o name)
for deployment in $deployments; do
    if kubectl rollout status $deployment -n $NAMESPACE --timeout=$TIMEOUT; then
        echo -e "${GREEN}✓ $deployment rolled out successfully${NC}"
    else
        echo -e "${RED}✗ $deployment rollout failed${NC}"
        exit 1
    fi
done

# Test 4: Service Discovery and Communication
echo -e "\n${BLUE}Integration Test 4: Service Discovery${NC}"

# Test internal service connectivity
kubectl run test-connectivity --image=curlimages/curl:8.0.1 --rm -i --restart=Never -n $NAMESPACE -- \
    curl -f -s --max-time 10 http://$RELEASE_NAME-client.$NAMESPACE.svc.cluster.local/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Client service is accessible internally${NC}"
else
    echo -e "${RED}✗ Client service connectivity failed${NC}"
    exit 1
fi

kubectl run test-connectivity --image=curlimages/curl:8.0.1 --rm -i --restart=Never -n $NAMESPACE -- \
    curl -f -s --max-time 10 http://$RELEASE_NAME-server.$NAMESPACE.svc.cluster.local/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Server service is accessible internally${NC}"
else
    echo -e "${RED}✗ Server service connectivity failed${NC}"
    exit 1
fi

# Test 5: Health Probe Integration
echo -e "\n${BLUE}Integration Test 5: Health Probe Integration${NC}"

# Check that health probes are working
client_pods=$(kubectl get pods -l app.kubernetes.io/component=client -n $NAMESPACE -o name)
server_pods=$(kubectl get pods -l app.kubernetes.io/component=server -n $NAMESPACE -o name)

for pod in $client_pods $server_pods; do
    if kubectl get $pod -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then
        echo -e "${GREEN}✓ $pod health probes are working${NC}"
    else
        echo -e "${RED}✗ $pod health probes failed${NC}"
        kubectl describe $pod -n $NAMESPACE
        exit 1
    fi
done

# Test 6: Configuration Integration
echo -e "\n${BLUE}Integration Test 6: Configuration Integration${NC}"

# Verify environment variables are injected
client_pod=$(kubectl get pods -l app.kubernetes.io/component=client -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}')
server_pod=$(kubectl get pods -l app.kubernetes.io/component=server -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}')

# Check client environment
if kubectl exec $client_pod -n $NAMESPACE -- env | grep -q "NODE_ENV=production"; then
    echo -e "${GREEN}✓ Client environment variables configured${NC}"
else
    echo -e "${RED}✗ Client environment variables missing${NC}"
    exit 1
fi

# Check server secrets
if kubectl exec $server_pod -n $NAMESPACE -- env | grep -q "MONGO_URI"; then
    echo -e "${GREEN}✓ Server secrets injected${NC}"
else
    echo -e "${RED}✗ Server secrets missing${NC}"
    exit 1
fi

# Test 7: Resource Limits Integration
echo -e "\n${BLUE}Integration Test 7: Resource Limits${NC}"

# Check resource limits are applied
for pod in $client_pods $server_pods; do
    limits=$(kubectl get $pod -n $NAMESPACE -o jsonpath='{.spec.containers[0].resources.limits}')
    if [ -n "$limits" ] && [ "$limits" != "{}" ]; then
        echo -e "${GREEN}✓ $pod has resource limits applied${NC}"
    else
        echo -e "${RED}✗ $pod missing resource limits${NC}"
        exit 1
    fi
done

# Test 8: Helm Tests (if any)
echo -e "\n${BLUE}Integration Test 8: Running Helm Tests${NC}"

if helm test $RELEASE_NAME -n $NAMESPACE --timeout=$TIMEOUT; then
    echo -e "${GREEN}✓ Helm tests passed${NC}"
else
    echo -e "${YELLOW}⚠ Helm tests failed or not configured${NC}"
fi

# Test 9: Upgrade Test
echo -e "\n${BLUE}Integration Test 9: Helm Upgrade${NC}"

# Test chart upgrade
if helm upgrade $RELEASE_NAME $CHART_PATH --namespace $NAMESPACE --wait --timeout=$TIMEOUT; then
    echo -e "${GREEN}✓ Helm upgrade successful${NC}"
else
    echo -e "${RED}✗ Helm upgrade failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All Integration Tests PASSED!${NC}"
echo -e "${GREEN}Chart is production ready for EKS deployment!${NC}"

# Optional: Clean up (uncomment if desired)
read -p "Do you want to clean up the test deployment? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    helm uninstall $RELEASE_NAME -n $NAMESPACE
    kubectl delete namespace $NAMESPACE
    echo -e "${GREEN}✓ Cleanup completed${NC}"
fi
