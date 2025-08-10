# Security Setup - Phase 1

## 🛡️ Overview
This directory contains security configurations and scanning tools for the Blog-App project.

## 📁 Structure
```
security/
├── .trivyignore          # Trivy vulnerability ignore patterns
├── trivy-config.yaml     # Trivy scanner configuration
├── .gitleaksignore       # GitLeaks false positive ignore
└── gitleaks-config.toml  # GitLeaks scanning rules

scripts/
├── scan-trivy.sh         # Trivy vulnerability scanner
├── scan-gitleaks.sh      # GitLeaks secret scanner
└── security-scan.sh      # Combined security scanner
```

## 🚀 Quick Start

### 1. Install Security Tools

**macOS:**
```bash
# Install Trivy
brew install aquasecurity/trivy/trivy

# Install GitLeaks  
brew install gitleaks

# Verify installations
trivy version
gitleaks version
```

**Linux:**
```bash
# Trivy
wget -qO- https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

# GitLeaks
wget https://github.com/zricethezav/gitleaks/releases/latest/download/gitleaks-linux-amd64.tar.gz
tar -xzf gitleaks-linux-amd64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

### 2. Run Security Scans

**Individual Scans:**
```bash
# Run GitLeaks secret scan
./scripts/scan-gitleaks.sh

# Run Trivy vulnerability scan
./scripts/scan-trivy.sh

# Scan specific directory
./scripts/scan-trivy.sh ./server
```

**Combined Security Scan:**
```bash
# Run all security checks
./scripts/security-scan.sh
```

## 📊 Understanding Results

### GitLeaks Results
- **JSON Report**: Detailed findings with line numbers and rule matches
- **CSV Report**: Tabular format for easy review
- **Exit Code 0**: No secrets found
- **Exit Code 1**: Secrets detected

### Trivy Results
- **Table Format**: Human-readable vulnerability list
- **Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Multiple Scanners**: Vulnerabilities, Secrets, Misconfigurations
- **Exit Code 0**: No critical issues
- **Exit Code 1**: Critical vulnerabilities found

## 🔧 Configuration

### Customizing Trivy
Edit `security/trivy-config.yaml`:
- Adjust severity levels
- Skip directories/files
- Configure output format

### Customizing GitLeaks
Edit `security/gitleaks-config.toml`:
- Add custom secret patterns
- Configure allowlists
- Adjust rule sensitivity

## 📝 Adding Ignores

### Trivy Ignores
Add to `security/.trivyignore`:
```
# Ignore specific CVE
CVE-2023-12345

# Ignore file patterns
**/test/**/*.js
```

### GitLeaks Ignores
Add to `security/.gitleaksignore`:
```
# Ignore specific files
src/config/test-config.js

# Ignore by commit hash
1234567890abcdef:src/example.js
```

## 🚨 CI/CD Integration

These security scans will be integrated into Azure DevOps Pipeline:

1. **Pre-commit**: GitLeaks scan on changed files
2. **Build Stage**: Full Trivy + GitLeaks scan
3. **Gate**: Pipeline fails on critical findings
4. **Reports**: Artifacts published for review

## 📈 Next Steps (Phase 2)

1. Create Kubernetes manifests with health probes
2. Integrate security scans into deployment pipeline
3. Configure container image scanning
4. Set up automated security notifications

## 🆘 Troubleshooting

### Common Issues

**Permission Denied:**
```bash
chmod +x scripts/*.sh
```

**Tool Not Found:**
- Verify installation with `trivy version` and `gitleaks version`
- Check PATH environment variable

**False Positives:**
- Add patterns to ignore files
- Review and update configuration files

### Getting Help
- Check tool documentation: [Trivy](https://aquasecurity.github.io/trivy/) | [GitLeaks](https://github.com/zricethezav/gitleaks)
- Review scan reports in `./reports/` directory
- Contact team for configuration questions
