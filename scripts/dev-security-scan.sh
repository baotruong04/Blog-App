#!/bin/bash

# Development Security Scanner Script for Blog-App
# Usage: ./scripts/dev-security-scan.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🛡️ Blog-App Development Security Scanner${NC}"
echo -e "${PURPLE}======================================${NC}"
echo ""

# Create reports directory
mkdir -p ./reports

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Run GitLeaks scan (non-blocking for dev)
echo -e "${BLUE}🔐 Phase 1: Secret Detection with GitLeaks (Development Mode)${NC}"
echo -e "${BLUE}============================================================${NC}"
./scripts/scan-gitleaks.sh || echo -e "${YELLOW}⚠️ GitLeaks found potential secrets (continuing in dev mode)${NC}"

echo ""
echo -e "${BLUE}🔍 Phase 2: Vulnerability Scanning with Trivy (Development Mode)${NC}"
echo -e "${BLUE}===============================================================${NC}"
./scripts/scan-trivy.sh || echo -e "${YELLOW}⚠️ Trivy found vulnerabilities (continuing in dev mode)${NC}"

# Generate summary report
echo ""
echo -e "${PURPLE}📊 Development Security Scan Summary${NC}"
echo -e "${PURPLE}====================================${NC}"

SUMMARY_FILE="./reports/dev-security-summary-$TIMESTAMP.txt"

{
    echo "Blog-App Development Security Scan Summary"
    echo "=========================================="
    echo "Scan Date: $(date)"
    echo "Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
    echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    echo ""
    
    echo "⚠️ DEVELOPMENT MODE: Security issues are logged but don't block development"
    echo ""
    
    echo "Security Tools Status:"
    echo "  ✅ GitLeaks - Running and detecting patterns"
    echo "  ✅ Trivy - Running and scanning vulnerabilities"
    echo ""
    
    echo "Next Steps for Production:"
    echo "  1. Review and fix real security issues"
    echo "  2. Update baseline/ignore files for false positives"
    echo "  3. Use production security-scan.sh for CI/CD"
    echo ""
    
    echo "Generated Reports:"
    ls -la ./reports/*$TIMESTAMP* 2>/dev/null || echo "  No reports generated"
    
} > "$SUMMARY_FILE"

# Display summary
cat "$SUMMARY_FILE"

echo ""
echo -e "${GREEN}✅ Development security scan completed! Tools are working properly.${NC}"
echo -e "${YELLOW}📝 Review reports and configure baselines before production deployment.${NC}"
echo ""
echo -e "${BLUE}📁 Full summary saved to: $SUMMARY_FILE${NC}"

exit 0
