#!/bin/bash

# GitLeaks Secret Scanner Script for Blog-App
# Usage: ./scripts/scan-gitleaks.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="./security/gitleaks-config.toml"
BASELINE_FILE="./security/gitleaks-baseline.json"
REPORT_DIR="./reports"

# Create reports directory if it doesn't exist
mkdir -p $REPORT_DIR

echo -e "${BLUE}🔐 Starting GitLeaks Secret Scan...${NC}"

# Check if gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
    echo -e "${RED}❌ GitLeaks is not installed. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gitleaks
    else
        echo -e "${RED}Please install GitLeaks manually for your OS${NC}"
        exit 1
    fi
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${YELLOW}📋 Scan Configuration:${NC}"
echo "  Config: $CONFIG_FILE"
echo "  Baseline: $BASELINE_FILE"
echo "  Reports: $REPORT_DIR"
echo ""

# Scan current repository for secrets
echo -e "${BLUE}🔍 Scanning repository for secrets...${NC}"
gitleaks detect \
  --config=$CONFIG_FILE \
  --baseline-path=$BASELINE_FILE \
  --source=. \
  --report-format=json \
  --report-path="$REPORT_DIR/gitleaks-$TIMESTAMP.json" \
  --verbose || SCAN_RESULT=$?

# Also create a human-readable report
echo -e "${BLUE}📄 Creating human-readable report...${NC}"
gitleaks detect \
  --config=$CONFIG_FILE \
  --baseline-path=$BASELINE_FILE \
  --source=. \
  --report-format=csv \
  --report-path="$REPORT_DIR/gitleaks-$TIMESTAMP.csv" \
  --verbose || true

# Scan specific directories if they exist
if [ -d "server" ]; then
    echo -e "${BLUE}🖥️ Scanning server directory...${NC}"
    gitleaks detect \
      --config=$CONFIG_FILE \
      --baseline-path=$BASELINE_FILE \
      --source=./server \
      --report-format=json \
      --report-path="$REPORT_DIR/gitleaks-server-$TIMESTAMP.json" \
      --verbose || true
fi

if [ -d "client" ]; then
    echo -e "${BLUE}💻 Scanning client directory...${NC}"
    gitleaks detect \
      --config=$CONFIG_FILE \
      --baseline-path=$BASELINE_FILE \
      --source=./client \
      --report-format=json \
      --report-path="$REPORT_DIR/gitleaks-client-$TIMESTAMP.json" \
      --verbose || true
fi

# Check scan results
if [ -f "$REPORT_DIR/gitleaks-$TIMESTAMP.json" ]; then
    # Count secrets found
    SECRET_COUNT=$(jq length "$REPORT_DIR/gitleaks-$TIMESTAMP.json" 2>/dev/null || echo "0")
    
    if [ "$SECRET_COUNT" -gt 0 ]; then
        echo -e "${RED}⚠️ Found $SECRET_COUNT potential secrets!${NC}"
        echo -e "${YELLOW}📊 Review the detailed report: $REPORT_DIR/gitleaks-$TIMESTAMP.json${NC}"
        
        # Show first few findings
        echo -e "${BLUE}🔍 Sample findings:${NC}"
        jq -r '.[] | "  - " + .RuleID + ": " + .File + ":" + (.StartLine|tostring)' "$REPORT_DIR/gitleaks-$TIMESTAMP.json" | head -5
        
        if [ "${SCAN_RESULT:-0}" -ne 0 ]; then
            echo -e "${RED}❌ GitLeaks scan failed with secrets detected!${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ No secrets detected!${NC}"
    fi
fi

echo -e "${GREEN}✅ GitLeaks scan completed!${NC}"
echo -e "${YELLOW}📊 Reports saved in: $REPORT_DIR${NC}"

# Show summary
echo ""
echo -e "${BLUE}📋 Generated Reports:${NC}"
ls -la $REPORT_DIR/*$TIMESTAMP*

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  - Review JSON reports for detailed findings"
echo "  - Add new findings to baseline: $BASELINE_FILE"
echo "  - Update rules in $CONFIG_FILE as needed"
