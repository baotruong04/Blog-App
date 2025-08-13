#!/bin/bash

# Helm Chart Unit Tests
# Following testing guide principles: Fast, Self-Validating, Repeatable, Understandable

set -e

CHART_PATH="helm/blog-app"
RELEASE_NAME="blog-app-test"
NAMESPACE="blog-app-test"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Helm Chart Unit Tests...${NC}"

# Test 1: Chart Linting (Fast Execution)
echo -e "\n${YELLOW}Test 1: Helm Chart Linting${NC}"
if helm lint $CHART_PATH; then
    echo -e "${GREEN}✓ Chart linting PASSED${NC}"
else
    echo -e "${RED}✗ Chart linting FAILED${NC}"
    exit 1
fi

# Test 2: Template Rendering (Isolate the Unit)
echo -e "\n${YELLOW}Test 2: Template Rendering${NC}"
if helm template $RELEASE_NAME $CHART_PATH --namespace $NAMESPACE > /tmp/rendered-templates.yaml; then
    echo -e "${GREEN}✓ Template rendering PASSED${NC}"
else
    echo -e "${RED}✗ Template rendering FAILED${NC}"
    exit 1
fi

# Test 3: Required Resources Validation (Self-Validating)
echo -e "\n${YELLOW}Test 3: Required Resources Validation${NC}"

required_resources=(
    "kind: Namespace"
    "kind: Deployment"
    "kind: Service" 
    "kind: ConfigMap"
    "kind: Secret"
    "kind: Ingress"
)

for resource in "${required_resources[@]}"; do
    if grep -q "$resource" /tmp/rendered-templates.yaml; then
        echo -e "${GREEN}✓ $resource found${NC}"
    else
        echo -e "${RED}✗ $resource missing${NC}"
        exit 1
    fi
done

# Test 4: Health Probe Configuration (Understandable)
echo -e "\n${YELLOW}Test 4: Health Probe Configuration${NC}"

probe_checks=(
    "startupProbe"
    "readinessProbe" 
    "livenessProbe"
    "httpGet"
)

for probe in "${probe_checks[@]}"; do
    if grep -q "$probe" /tmp/rendered-templates.yaml; then
        echo -e "${GREEN}✓ $probe configuration found${NC}"
    else
        echo -e "${RED}✗ $probe configuration missing${NC}"
        exit 1
    fi
done

# Test 5: Security Context Validation (No Side Effects)
echo -e "\n${YELLOW}Test 5: Security Context Validation${NC}"

security_checks=(
    "allowPrivilegeEscalation: false"
    "runAsNonRoot: true"
    "capabilities:"
)

for security in "${security_checks[@]}"; do
    if grep -q "$security" /tmp/rendered-templates.yaml; then
        echo -e "${GREEN}✓ Security setting found: $security${NC}"
    else
        echo -e "${RED}✗ Security setting missing: $security${NC}"
        exit 1
    fi
done

# Test 6: Resource Limits (Timely)
echo -e "\n${YELLOW}Test 6: Resource Limits Validation${NC}"

if grep -A5 -B5 "resources:" /tmp/rendered-templates.yaml | grep -q "limits:"; then
    echo -e "${GREEN}✓ Resource limits configured${NC}"
else
    echo -e "${RED}✗ Resource limits missing${NC}"
    exit 1
fi

if grep -A5 -B5 "resources:" /tmp/rendered-templates.yaml | grep -q "requests:"; then
    echo -e "${GREEN}✓ Resource requests configured${NC}"
else
    echo -e "${RED}✗ Resource requests missing${NC}"
    exit 1
fi

# Test 7: Dry-run Validation (Repeatable)
echo -e "\n${YELLOW}Test 7: Kubernetes Dry-run Validation${NC}"

# Check if kubectl can connect to a cluster
if kubectl cluster-info > /dev/null 2>&1; then
    if kubectl apply --dry-run=client -f /tmp/rendered-templates.yaml > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Kubernetes dry-run validation PASSED${NC}"
    else
        echo -e "${RED}✗ Kubernetes dry-run validation FAILED${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Kubernetes cluster not available, skipping dry-run validation${NC}"
    echo -e "${YELLOW}  (This test requires a connected Kubernetes cluster)${NC}"
fi

# Test 8: Values Override Test (Repeatable)
echo -e "\n${YELLOW}Test 8: Values Override Test${NC}"

# Create test values
cat > /tmp/test-values.yaml << EOF
client:
  image:
    tag: "test-tag"
server:
  image:
    tag: "test-tag"
config:
  nodeEnv: "testing"
EOF

if helm template $RELEASE_NAME $CHART_PATH --values /tmp/test-values.yaml | grep -q "test-tag"; then
    echo -e "${GREEN}✓ Values override working${NC}"
else
    echo -e "${RED}✗ Values override failed${NC}"
    exit 1
fi

# Cleanup (No Side Effects)
rm -f /tmp/rendered-templates.yaml /tmp/test-values.yaml

echo -e "\n${GREEN}🎉 All Helm Chart Unit Tests PASSED!${NC}"
echo -e "${GREEN}Chart is ready for deployment and integration testing.${NC}"
