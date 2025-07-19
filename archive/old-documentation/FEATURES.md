# PromptShield Enterprise Features

_Complete feature reference for PromptShield CLI_

## 🎯 Core Capabilities

### AI Security Detection

- **Prompt Injection Attacks**: DAN, jailbreaks, role-playing attacks
- **System Prompt Extraction**: Attempts to reveal internal instructions
- **Instruction Bypass**: "Ignore previous instructions" patterns
- **Role Manipulation**: Attempts to change AI behavior or persona
- **Chain-of-Thought Exploitation**: Complex multi-step attack patterns

### Privacy & Compliance Scanning

- **PII Detection**: Emails, phone numbers, SSNs, addresses, names
- **Financial Data**: Credit cards, bank accounts, routing numbers
- **Medical Information**: Patient IDs, medical record numbers, diagnoses
- **API Keys & Secrets**: GitHub tokens, AWS keys, database credentials
- **GDPR Compliance**: Personal data processing, consent violations
- **HIPAA Compliance**: Protected Health Information (PHI) detection

### Content Quality Assurance

- **Bias Detection**: Gender, racial, age, religious, political bias
- **Hallucination Patterns**: Uncertain language, unsupported claims
- **Harmful Content**: Violence, self-harm, illegal activities
- **Misinformation**: False facts, conspiracy theories, misleading claims

## 🔧 CLI Commands & Features

### Advanced Scanning Options

**Multi-Format Support:**

```bash
# JSON files with nested objects
promptshield scan data.json --max-depth 4

# NDJSON streaming for large datasets
promptshield scan large-data.ndjson --streaming-threshold 1000

# Plain text files
promptshield scan documents/*.txt --parallel 8

# Mixed file types in directories
promptshield scan /data/ --include "*.json,*.txt,*.ndjson"
```

**Smart Field Detection:**

```bash
# Auto-detect common fields
promptshield scan chat-logs.json  # Finds: prompt, response, message, content

# Custom field selection
promptshield scan data.json --fields user_input,ai_output,system_message

# Scan entire objects as strings
promptshield scan data.json --scan-entire-object
```

**Performance Optimization:**

```bash
# Parallel processing with custom workers
promptshield scan /data/ --parallel 16 --batch-size 50

# Memory-conscious scanning
promptshield scan huge-file.json --memory-warning-threshold 0.8

# Streaming mode for 10GB+ files
promptshield scan massive-dataset.ndjson --streaming-threshold 500
```

### Rule Management System

**RulePack Operations:**

```bash
# Create custom rulepacks from templates
promptshield init security-rules.yaml --template security
promptshield init compliance-rules.yaml --template gdpr
promptshield init custom-patterns.yaml --template basic

# Validate rulepack syntax
promptshield validate my-rules.yaml --verbose

# List rules with filtering
promptshield list --rulepack pii.yaml --category security --enabled-only

# Test specific rules
promptshield test "test content" --rule email --rulepack pii.yaml
```

**Rule Development Workflow:**

```bash
# Create rule from scratch
promptshield init new-rule.yaml --template basic

# Test rule against sample data
promptshield test "sample input" --rulepack new-rule.yaml --verbose

# Validate rule syntax
promptshield validate new-rule.yaml

# Deploy to production scanning
promptshield scan production-data/ --rulepack new-rule.yaml
```

### Output & Reporting

**Multiple Output Formats:**

```bash
# JSON for API integration
promptshield scan data.json --output json --output-file report.json

# HTML dashboard with charts
promptshield scan data.json --output html --output-file dashboard.html

# CSV for spreadsheet analysis
promptshield scan data.json --output csv --output-file violations.csv

# NDJSON for streaming pipelines
promptshield scan data.json --output ndjson --output-file stream.ndjson

# Table for terminal viewing
promptshield scan data.json --output table
```

**Advanced Filtering:**

```bash
# Severity-based filtering
promptshield scan data.json --severity critical,high --fail-on critical

# Category-based filtering
promptshield scan data.json --category security,pii,compliance

# Rule-specific filtering
promptshield scan data.json --include-rules email,ssn,phone

# Exclude specific rules
promptshield scan data.json --exclude-rules address,name
```

**Export & Compression:**

```bash
# Compressed output
promptshield scan data.json --output-file report.json.gz --compress gzip

# Multiple formats simultaneously
promptshield scan data.json --output json --output-file json-report.json \
  --output html --output-file html-report.html

# Timestamped outputs
promptshield scan data.json --output-file "report-$(date +%Y%m%d).json"
```

## 🚀 Performance Features

### Memory Management

- **Streaming Processing**: Handle files larger than available RAM
- **Memory Monitoring**: Real-time usage tracking with configurable thresholds
- **Automatic Optimization**: Smart detection of large files for streaming mode
- **Garbage Collection**: Efficient memory cleanup during long-running scans

### Parallel Processing

- **Multi-Core Utilization**: Leverage all available CPU cores
- **Configurable Workers**: Fine-tune worker count for optimal performance
- **Batch Processing**: Efficient handling of multiple files
- **Load Balancing**: Distribute work evenly across workers

### Scalability

- **Large File Support**: 10GB+ files with streaming mode
- **Directory Scanning**: Thousands of files with parallel processing
- **Memory Efficiency**: <100MB memory usage even for 10GB files
- **Progress Tracking**: Real-time progress indicators for long operations

## 🔍 Rule Engine Features

### Pattern Matching

```yaml
# Regex patterns with full PCRE support
match_regex:
  - "\\b[A-Z]{2,}-\\d{4,}\\b"
  - "(?i)\\b(password|secret|key)\\s*[:=]\\s*[A-Za-z0-9]+"

# Keyword matching with case options
match_keywords:
  - "ignore all previous instructions"
  - "you are now DAN"
case_sensitive: false

# Combined patterns (AND logic)
match_regex: ["\\d{3}-\\d{2}-\\d{4}"]
match_keywords: ["SSN", "social security"]
```

### Rule Configuration

```yaml
# Rule metadata
id: custom-api-key
name: 'Custom API Key Detection'
description: 'Detects organization-specific API key format'
severity: critical # critical, high, medium, low
category: security # security, pii, bias, compliance, hallucination
enabled: true # Enable/disable individual rules

# Advanced options
case_sensitive: false # Case-insensitive matching
multiline: false # Cross-line pattern matching
context_window: 50 # Characters of context to include
```

### Rule Templates

- **Security Template**: API keys, passwords, injection patterns
- **PII Template**: Personal information, contact details
- **Bias Template**: Discriminatory language, unfair treatment
- **Compliance Template**: GDPR, HIPAA, SOX requirements
- **Custom Template**: Blank template for custom patterns

## 🔧 Integration Features

### CI/CD Pipeline Integration

```bash
# Exit codes for automation
promptshield scan src/ --fail-on high  # Exit 1 if high+ violations found

# Quiet mode for scripts
promptshield scan data/ --quiet --output-file violations.json

# JSON output for parsing
VIOLATIONS=$(promptshield scan data.json --output json | jq '.totalViolations')
if [ "$VIOLATIONS" -gt 0 ]; then exit 1; fi
```

### API Integration Examples

```javascript
// Node.js integration
const { execSync } = require('child_process');
const result = execSync('promptshield scan data.json --output json', {encoding: 'utf8'});
const report = JSON.parse(result);

// Python integration
import subprocess
result = subprocess.run(['promptshield', 'scan', 'data.json', '--output', 'json'],
                       capture_output=True, text=True)
report = json.loads(result.stdout)
```

### Docker & Containerization

```dockerfile
# Multi-stage build
FROM node:16-alpine AS scanner
RUN npm install -g promptshield

# Add to existing container
RUN npm install -g promptshield
COPY rulepacks/ /app/rulepacks/
RUN promptshield scan /app/data --rulepack /app/rulepacks/security.yaml
```

## 📊 Monitoring & Analytics

### Performance Metrics

- **Scan Duration**: Time per file, total scan time
- **Memory Usage**: Peak memory, average usage
- **Throughput**: Files per second, violations per minute
- **Resource Utilization**: CPU usage, I/O statistics

### Violation Analytics

- **Severity Distribution**: Count by critical/high/medium/low
- **Category Breakdown**: Security vs. PII vs. compliance violations
- **Trend Analysis**: Violations over time
- **Pattern Recognition**: Most common violation types

### Reporting Dashboard

- **Interactive HTML Reports**: Filterable, sortable violation lists
- **Charts & Graphs**: Visual representation of scan results
- **Export Capabilities**: PDF, Excel, CSV exports
- **Executive Summaries**: High-level overview for management

## 🔒 Security Features

### Data Protection

- **Offline Operation**: No data ever leaves your system
- **Input Validation**: All user inputs sanitized and validated
- **File Sandboxing**: Restricted file system access
- **Memory Protection**: Secure memory handling for sensitive data

### Access Control

- **File Permissions**: Respect existing file system permissions
- **Read-Only Operation**: Never modifies source files
- **Audit Logging**: Optional logging of scan operations
- **Secure Defaults**: Conservative security settings by default

### Compliance Support

- **GDPR Readiness**: Built-in PII detection rules
- **HIPAA Support**: PHI detection and reporting
- **SOX Compliance**: Financial data scanning
- **Custom Frameworks**: Extensible for industry-specific requirements

## 🎛️ Configuration Management

### Global Configuration

```bash
# Set default rulepack
promptshield config set default-rulepack /path/to/rules.yaml

# Configure output preferences
promptshield config set default-output json
promptshield config set default-severity high,critical

# Performance tuning
promptshield config set parallel-workers 8
promptshield config set memory-threshold 0.8
```

### Project Configuration

```yaml
# promptshield.config.yaml
default:
  rulepack: 'rulepacks/security.yaml'
  output: 'json'
  severity: ['critical', 'high']

performance:
  parallel: true
  workers: 4
  streaming_threshold: 1000

output:
  file: 'reports/scan-{{date}}.json'
  compress: true
```

### Environment Variables

```bash
export PROMPTSHIELD_RULEPACK="rulepacks/production.yaml"
export PROMPTSHIELD_OUTPUT="json"
export PROMPTSHIELD_PARALLEL="true"
export PROMPTSHIELD_WORKERS="8"
```

## 🚀 Advanced Use Cases

### Enterprise Security Workflows

```bash
# Multi-stage security scanning
promptshield scan user-inputs/ --rulepack rulepacks/injection.yaml --fail-on critical
promptshield scan ai-outputs/ --rulepack rulepacks/safety.yaml --fail-on high
promptshield scan all-data/ --rulepack rulepacks/compliance.yaml --output-file compliance-report.html
```

### Data Processing Pipelines

```bash
# Streaming data validation
cat large-dataset.ndjson | promptshield scan --ndjson --output ndjson | jq '.violations[]'

# Batch processing with parallel execution
find /data -name "*.json" | xargs -P 8 -I {} promptshield scan {} --output json

# Quality assurance pipeline
promptshield scan training-data/ --category bias,hallucination --severity high,critical
```

### Compliance Automation

```bash
# GDPR compliance check
promptshield scan customer-data/ --rulepack rulepacks/gdpr.yaml --output html --output-file gdpr-report.html

# Regular security audits
promptshield scan production-logs/ --rulepack rulepacks/security.yaml --output csv --output-file security-audit.csv

# Continuous monitoring
watch -n 300 'promptshield scan /app/data --quiet --fail-on critical'
```

---

## 📈 Performance Benchmarks

| Operation               | File Size          | Duration | Memory | Throughput |
| ----------------------- | ------------------ | -------- | ------ | ---------- |
| Single JSON scan        | 1MB                | <100ms   | 50MB   | 10MB/s     |
| Directory scan          | 100MB (1000 files) | <5s      | 150MB  | 20MB/s     |
| Parallel scan (8 cores) | 1GB                | <30s     | 300MB  | 35MB/s     |
| Streaming mode          | 10GB               | <2min    | 100MB  | 85MB/s     |
| NDJSON processing       | 5GB                | <1min    | 80MB   | 85MB/s     |

## 🎯 Success Metrics

### Detection Accuracy

- **True Positive Rate**: >95% for known violation patterns
- **False Positive Rate**: <5% on clean datasets
- **Coverage**: 100% of OWASP Top 10 for LLM applications
- **Performance**: Sub-second response for interactive use

### Developer Experience

- **Setup Time**: <1 minute from install to first scan
- **Learning Curve**: Basic usage in 5 minutes
- **Documentation**: 100% command coverage
- **Error Messages**: Actionable guidance for all failure modes

### Enterprise Readiness

- **Scalability**: Handles enterprise-scale datasets
- **Integration**: Works with all major CI/CD platforms
- **Compliance**: Supports major regulatory frameworks
- **Support**: Professional support available

---

**PromptShield** - Enterprise-grade AI security scanning that scales with your needs.
