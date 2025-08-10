#!/bin/bash

# Combined Security Scanner Script for Blog-App
# Usage: ./scripts/security-scan.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🛡️ Blog-App Security Scanner${NC}"
echo -e "${PURPLE}=============================${NC}"
echo ""

# Create reports directory
mkdir -p ./reports

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OVERALL_RESULT=0

# Run GitLeaks scan
echo -e "${BLUE}🔐 Phase 1: Secret Detection with GitLeaks${NC}"
echo -e "${BLUE}===========================================${NC}"
./scripts/scan-gitleaks.sh || GITLEAKS_RESULT=$?

echo ""
echo -e "${BLUE}🔍 Phase 2: Vulnerability Scanning with Trivy${NC}"
echo -e "${BLUE}==============================================${NC}"
./scripts/scan-trivy.sh || TRIVY_RESULT=$?

# Generate summary report
echo ""
echo -e "${PURPLE}📊 Security Scan Summary${NC}"
echo -e "${PURPLE}========================${NC}"

SUMMARY_FILE="./reports/security-summary-$TIMESTAMP.txt"

{
    echo "Blog-App Security Scan Summary"
    echo "=============================="
    echo "Scan Date: $(date)"
    echo "Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
    echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    echo ""
    
    echo "GitLeaks Scan Result:"
    if [ "${GITLEAKS_RESULT:-0}" -eq 0 ]; then
        echo "  ✅ PASSED - No secrets detected"
    else
        echo "  ❌ FAILED - Secrets detected"
        OVERALL_RESULT=1
    fi
    
    echo ""
    echo "Trivy Scan Result:"
    if [ "${TRIVY_RESULT:-0}" -eq 0 ]; then
        echo "  ✅ PASSED - No critical vulnerabilities"
    else
        echo "  ❌ FAILED - Critical vulnerabilities found"
        OVERALL_RESULT=1
    fi
    
    echo ""
    echo "Overall Security Status:"
    if [ $OVERALL_RESULT -eq 0 ]; then
        echo "  ✅ PASSED - All security checks passed"
    else
        echo "  ❌ FAILED - Security issues found"
    fi
    
    echo ""
    echo "Generated Reports:"
    ls -la ./reports/*$TIMESTAMP* 2>/dev/null || echo "  No reports generated"
    
} > "$SUMMARY_FILE"

# Display summary
cat "$SUMMARY_FILE"

# Final status
echo ""
if [ $OVERALL_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 All security checks passed! Your code is ready for deployment.${NC}"
else
    echo -e "${RED}⚠️ Security issues found! Please review the reports and fix issues before deployment.${NC}"
fi

echo ""
echo -e "${BLUE}📁 Full summary saved to: $SUMMARY_FILE${NC}"

exit $OVERALL_RESULT
