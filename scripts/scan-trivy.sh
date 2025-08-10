#!/bin/bash

# Trivy Security Scanner Script for Blog-App
# Usage: ./scripts/scan-trivy.sh [target]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="./security/trivy-config.yaml"
IGNORE_FILE="./security/.trivyignore"
REPORT_DIR="./reports"

# Create reports directory if it doesn't exist
mkdir -p $REPORT_DIR

echo -e "${BLUE}🔍 Starting Trivy Security Scan...${NC}"

# Check if trivy is installed
if ! command -v trivy &> /dev/null; then
    echo -e "${RED}❌ Trivy is not installed. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install aquasecurity/trivy/trivy
    else
        echo -e "${RED}Please install Trivy manually for your OS${NC}"
        exit 1
    fi
fi

# Determine scan target
TARGET=${1:-"."}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${YELLOW}📋 Scan Configuration:${NC}"
echo "  Target: $TARGET"
echo "  Config: $CONFIG_FILE"
echo "  Ignore: $IGNORE_FILE"
echo ""

# Scan filesystem for vulnerabilities
echo -e "${BLUE}🔍 Scanning filesystem for vulnerabilities...${NC}"
trivy fs \
  --config $CONFIG_FILE \
  --ignorefile $IGNORE_FILE \
  --format table \
  --output "$REPORT_DIR/trivy-fs-$TIMESTAMP.txt" \
  $TARGET

# Scan for secrets
echo -e "${BLUE}🔐 Scanning for secrets...${NC}"
trivy fs \
  --config $CONFIG_FILE \
  --ignorefile $IGNORE_FILE \
  --scanners secret \
  --format table \
  --output "$REPORT_DIR/trivy-secrets-$TIMESTAMP.txt" \
  $TARGET

# Scan for misconfigurations
echo -e "${BLUE}⚙️ Scanning for misconfigurations...${NC}"
trivy fs \
  --config $CONFIG_FILE \
  --ignorefile $IGNORE_FILE \
  --scanners config \
  --format table \
  --output "$REPORT_DIR/trivy-config-$TIMESTAMP.txt" \
  $TARGET

# If Docker images exist, scan them too
if [ -f "server/Dockerfile" ] || [ -f "client/Dockerfile" ]; then
    echo -e "${BLUE}🐳 Scanning Docker configurations...${NC}"
    
    # Scan server Dockerfile
    if [ -f "server/Dockerfile" ]; then
        echo -e "${YELLOW}  📄 Scanning server/Dockerfile...${NC}"
        trivy config \
          --format table \
          --output "$REPORT_DIR/trivy-dockerfile-server-$TIMESTAMP.txt" \
          server/Dockerfile
    fi
    
    # Scan client Dockerfile  
    if [ -f "client/Dockerfile" ]; then
        echo -e "${YELLOW}  📄 Scanning client/Dockerfile...${NC}"
        trivy config \
          --format table \
          --output "$REPORT_DIR/trivy-dockerfile-client-$TIMESTAMP.txt" \
          client/Dockerfile
    fi
fi

echo -e "${GREEN}✅ Trivy scan completed!${NC}"
echo -e "${YELLOW}📊 Reports saved in: $REPORT_DIR${NC}"
echo ""

# Show summary
echo -e "${BLUE}📋 Scan Summary:${NC}"
ls -la $REPORT_DIR/*$TIMESTAMP*

# Check for critical issues in main scan
if grep -q "CRITICAL" "$REPORT_DIR/trivy-fs-$TIMESTAMP.txt"; then
    echo -e "${RED}⚠️ CRITICAL vulnerabilities found! Please review the reports.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No critical vulnerabilities found.${NC}"
fi
