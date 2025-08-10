#!/bin/bash

# Kubernetes Health Check Script for Blog-App
# Usage: ./scripts/k8s-health-check.sh [namespace]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE=${1:-blog-app}

echo -e "${BLUE}🏥 Blog-App Health Check${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${RED}❌ Namespace '$NAMESPACE' does not exist${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Checking deployments in namespace: $NAMESPACE${NC}"
echo ""

# Check deployments
echo -e "${BLUE}🚀 Deployment Status:${NC}"
kubectl get deployments -n $NAMESPACE -l app=blog-app

echo ""
echo -e "${BLUE}🏃 Pod Status:${NC}"
kubectl get pods -n $NAMESPACE -l app=blog-app -o wide

echo ""
echo -e "${BLUE}🔄 Service Status:${NC}"
kubectl get services -n $NAMESPACE -l app=blog-app

echo ""

# Detailed health check for each component
components=("server" "client")

for component in "${components[@]}"; do
    echo -e "${YELLOW}🔍 Checking $component component...${NC}"
    
    # Get pods for component
    pods=$(kubectl get pods -n $NAMESPACE -l component=$component -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$pods" ]; then
        echo -e "${RED}  ❌ No pods found for $component${NC}"
        continue
    fi
    
    for pod in $pods; do
        echo -e "${BLUE}  📦 Pod: $pod${NC}"
        
        # Check pod status
        status=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.phase}')
        echo -e "    Status: $status"
        
        # Check ready conditions
        ready=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")
        if [ "$ready" = "True" ]; then
            echo -e "${GREEN}    ✅ Ready: Yes${NC}"
        else
            echo -e "${RED}    ❌ Ready: No${NC}"
        fi
        
        # Check restart count
        restarts=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null || echo "0")
        echo -e "    Restarts: $restarts"
        
        # Check resource usage (if metrics-server available)
        if kubectl top pod $pod -n $NAMESPACE &> /dev/null; then
            echo -e "${BLUE}    📊 Resource Usage:${NC}"
            kubectl top pod $pod -n $NAMESPACE --no-headers | awk '{print "      CPU: " $2 ", Memory: " $3}'
        fi
        
        # Health probe status
        echo -e "${BLUE}    🏥 Probe Status:${NC}"
        
        # Liveness probe
        liveness=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="ContainersReady")].status}' 2>/dev/null || echo "Unknown")
        if [ "$liveness" = "True" ]; then
            echo -e "${GREEN}      ✅ Liveness: Healthy${NC}"
        else
            echo -e "${RED}      ❌ Liveness: Unhealthy${NC}"
        fi
        
        # Readiness probe  
        if [ "$ready" = "True" ]; then
            echo -e "${GREEN}      ✅ Readiness: Ready${NC}"
        else
            echo -e "${RED}      ❌ Readiness: Not Ready${NC}"
        fi
        
        echo ""
    done
done

# Service connectivity test
echo -e "${BLUE}🔗 Service Connectivity Test${NC}"
echo ""

# Test server health endpoint
SERVER_SERVICE=$(kubectl get service blog-server -n $NAMESPACE -o jsonpath='{.metadata.name}' 2>/dev/null || echo "")
if [ ! -z "$SERVER_SERVICE" ]; then
    echo -e "${YELLOW}🖥️ Testing server health endpoint...${NC}"
    
    # Port forward test
    kubectl port-forward service/blog-server 15000:5000 -n $NAMESPACE &
    PF_PID=$!
    sleep 3
    
    if curl -s -f http://localhost:15000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Server health endpoint is responding${NC}"
    else
        echo -e "${RED}  ❌ Server health endpoint is not responding${NC}"
    fi
    
    kill $PF_PID 2>/dev/null || true
    wait $PF_PID 2>/dev/null || true
fi

# Test client service
CLIENT_SERVICE=$(kubectl get service blog-client -n $NAMESPACE -o jsonpath='{.metadata.name}' 2>/dev/null || echo "")
if [ ! -z "$CLIENT_SERVICE" ]; then
    echo -e "${YELLOW}💻 Testing client service...${NC}"
    
    # Port forward test
    kubectl port-forward service/blog-client 18080:80 -n $NAMESPACE &
    PF_PID=$!
    sleep 3
    
    if curl -s -f http://localhost:18080 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Client service is responding${NC}"
    else
        echo -e "${RED}  ❌ Client service is not responding${NC}"
    fi
    
    kill $PF_PID 2>/dev/null || true
    wait $PF_PID 2>/dev/null || true
fi

echo ""

# Overall health summary
failed_pods=$(kubectl get pods -n $NAMESPACE -l app=blog-app --field-selector=status.phase!=Running -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | wc -w)
total_pods=$(kubectl get pods -n $NAMESPACE -l app=blog-app -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | wc -w)

echo -e "${BLUE}📋 Health Summary${NC}"
echo -e "${BLUE}=================${NC}"
echo -e "${YELLOW}Total Pods: $total_pods${NC}"
echo -e "${YELLOW}Failed Pods: $failed_pods${NC}"

if [ $failed_pods -eq 0 ] && [ $total_pods -gt 0 ]; then
    echo -e "${GREEN}🎉 All pods are healthy!${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Some pods are not healthy. Check the details above.${NC}"
    
    if [ $failed_pods -gt 0 ]; then
        echo ""
        echo -e "${RED}Failed pods:${NC}"
        kubectl get pods -n $NAMESPACE -l app=blog-app --field-selector=status.phase!=Running
    fi
    
    exit 1
fi
