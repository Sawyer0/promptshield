# PromptShield - Enterprise Security Scanner for AI/ML Data

**Version 1.0.0**

PromptShield is an enterprise-grade CLI tool for scanning conversational AI data, prompts, and responses for security vulnerabilities, personally identifiable information (PII), bias, and other compliance issues. Built for AI/ML teams, security professionals, and DevOps engineers who need to ensure data safety in production environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Commands Reference](#commands-reference)
- [Input Formats](#input-formats)
- [Output Formats](#output-formats)
- [Built-in RulePacks](#built-in-rulepacks)
- [Enterprise Features](#enterprise-features)
- [CI/CD Integration](#cicd-integration)
- [Performance & Scaling](#performance--scaling)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Quick Start

```bash
# Install globally
npm install -g promptshield

# Basic scan
promptshield scan data/conversations.json

# Scan with specific output format
promptshield scan data/prompts.json --output html --output-file report.html

# Scan for high-severity PII only
promptshield scan data/training.ndjson --category pii --severity high,critical

# CI/CD integration - fail build on medium+ violations
promptshield scan data/ --fail-on medium --quiet
```

---

## Installation

### NPM Installation (Recommended)

```bash
# Global installation
npm install -g promptshield

# Verify installation
promptshield --version
```

### Development Installation

```bash
# Clone repository
git clone https://github.com/your-org/promptshield.git
cd promptshield

# Install dependencies
npm install

# Build and test
npm run build
npm test

# Run locally
npm run dev scan examples/sample.json
```

### Requirements

- **Node.js**: 16.x, 18.x, or 20.x
- **NPM**: 7.x or higher
- **Memory**: 512MB+ (for large datasets: 2GB+ recommended)
- **Storage**: 100MB for installation + output storage

---

## Core Concepts

### RulePacks

Collections of security rules defined in YAML format. PromptShield includes built-in RulePacks for:

- **PII Detection** - Personal identifiable information
- **Bias Detection** - Language bias and discrimination
- **Hallucination Detection** - AI-generated inaccuracies
- **Custom Rules** - Organization-specific patterns

### Violations

Security issues found in your data, classified by:

- **Severity**: `low`, `medium`, `high`, `critical`
- **Category**: `pii`, `bias`, `hallucination`, `security`, `compliance`
- **Context**: Object index, field name, line number

### Scanning Modes

- **File Scanning**: Single files or directory batch processing
- **Streaming**: Memory-efficient processing for large datasets
- **Schema Validation**: Ensure data structure compliance
- **Format Detection**: Automatic JSON/NDJSON/TXT recognition

---

## Commands Reference

### `scan` - Security Scanning

**Syntax:**

```bash
promptshield scan <input> [options]
```

**Parameters:**

- `<input>` - File path, directory, or data string to scan

**Core Options:**

```bash
--rulepack <path>           # Custom RulePack YAML file
--output <format>           # Output format (default: markdown)
--output-file <file>        # Save report to file
--fail-on <severity>        # Exit with error on severity level
--quiet                     # Suppress progress output
--verbose                   # Detailed output information
--debug                     # Enable debug logging
```

**Filtering Options:**

```bash
--severity <levels>         # Filter by severity (low,medium,high,critical)
--category <categories>     # Filter by category (pii,bias,hallucination)
--fields <fields>           # Specific fields to scan (default: prompt,response)
--max-violations <number>   # Limit violations reported
--offset <number>           # Pagination offset
--limit <number>            # Pagination limit
```

**Processing Options:**

```bash
--scan-entire-object        # Scan complete object as string
--max-objects <number>      # Limit objects processed
--max-depth <number>        # Nested object depth limit (default: 4)
--streaming-threshold <num> # Streaming activation threshold (default: 1000)
--memory-warning-threshold <float> # Memory warning level (0.0-1.0, default: 0.8)
--timeout <seconds>         # Processing timeout (default: 300)
```

**Format and Schema Options:**

```bash
--ndjson                    # Force NDJSON processing mode
--schema <schema>           # Validate against schema (basic|extended|flexible|file.json)
--compress <type>           # Compress output (gzip|deflate)
--compression-level <level> # Compression level (0-9, default: 6)
--no-color                  # Disable colored output
--strict                    # Treat warnings as errors
```

**Examples:**

```bash
# Basic security scan
promptshield scan data/conversations.json

# High-severity PII scan with HTML output
promptshield scan training_data.ndjson \
  --category pii \
  --severity high,critical \
  --output html \
  --output-file pii_report.html

# Enterprise CI/CD scan
promptshield scan datasets/ \
  --rulepack enterprise/security.yaml \
  --fail-on medium \
  --output json \
  --quiet

# Large dataset with streaming
promptshield scan large_dataset.ndjson \
  --streaming-threshold 500 \
  --memory-warning-threshold 0.9 \
  --compress gzip \
  --output-file results.json.gz

# Custom field scanning
promptshield scan chat_logs.json \
  --fields "user_message,bot_response,metadata" \
  --scan-entire-object \
  --max-depth 6
```

### `validate` - Input Validation

**Syntax:**

```bash
promptshield validate <input> [options]
```

**Options:**

```bash
--schema <schema>           # JSON schema for validation
--rulepack <path>           # Validate against RulePack schema
--output <format>           # Output format (json|text, default: text)
```

**Examples:**

```bash
# Validate JSON structure
promptshield validate data.json --schema extended

# Validate custom RulePack
promptshield validate custom.yaml --rulepack
```

### `list` - Rule Discovery

**Syntax:**

```bash
promptshield list [options]
```

**Options:**

```bash
--rulepack <path>           # List rules from specific RulePack
--category <category>       # Filter by category
--severity <severity>       # Filter by severity level
--enabled-only              # Show only enabled rules
```

**Examples:**

```bash
# List all available rules
promptshield list

# Show PII rules only
promptshield list --category pii

# List rules from custom RulePack
promptshield list --rulepack custom/enterprise.yaml
```

### `create` - RulePack Generation

**Syntax:**

```bash
promptshield create <name> [options]
```

**Options:**

```bash
--template <template>       # Template type (basic|pii|bias|security|compliance)
--description <text>        # RulePack description
--category <category>       # Primary category
--force                     # Overwrite existing RulePack
```

**Examples:**

```bash
# Create PII RulePack
promptshield create company-pii --template pii --description "Company PII Rules"

# Create custom security rules
promptshield create security-audit \
  --template security \
  --category security \
  --force
```

### `update` - RulePack Management

**Syntax:**

```bash
promptshield update [options]
```

**Options:**

```bash
--force                     # Force update regardless of changes
--registry <url>            # Custom RulePack registry URL
```

**Examples:**

```bash
# Update all RulePacks
promptshield update

# Force update from custom registry
promptshield update --registry https://rules.company.com --force
```

---

## Input Formats

### Supported File Types

#### JSON (`.json`)

Standard JSON format supporting objects and arrays:

```json
[
  {
    "prompt": "What is your name?",
    "response": "I'm Claude, an AI assistant created by Anthropic.",
    "metadata": {
      "user_id": "user123",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
]
```

#### NDJSON/JSONL (`.ndjson`, `.jsonl`)

Newline-delimited JSON for streaming large datasets:

```
{"prompt": "Hello", "response": "Hi there!", "user": "john@example.com"}
{"prompt": "How are you?", "response": "I'm doing well, thanks!", "user": "jane@company.com"}
```

#### Plain Text (`.txt`)

Raw text content scanned as single string:

```
This is a sample conversation.
User: My email is john.doe@example.com
Assistant: I understand you want to share your contact information.
```

### Processing Features

**Automatic Format Detection:**

- Extension-based detection (`.json`, `.ndjson`, `.jsonl`, `.txt`)
- Manual override with `--ndjson` flag
- Content-based fallback detection

**Large File Handling:**

- Streaming processing for NDJSON files
- Memory-efficient parsing with configurable thresholds
- Progress tracking and memory monitoring

**Nested Object Support:**

- Configurable depth traversal (`--max-depth`)
- Dot-notation field access (`user.profile.email`)
- Array element processing

---

## Output Formats

### Markdown (Default)

Human-readable reports with severity indicators and structured layout:

```markdown
# PromptShield Scan Report

**Scan Date:** 2024-01-15T10:30:00Z
**Files Scanned:** 3
**Total Violations:** 12

## Summary

### Severity Breakdown

- **high:** 2 violations
- **medium:** 4 violations
- **low:** 6 violations

### Category Breakdown

- **pii:** 8 violations
- **bias:** 4 violations

## Results

### File: data/conversations.json

- **[HIGH]** `email` (pii): Detects email addresses
  - **Match:** `john.doe@example.com` [Object 0, field: user_email]
```

### JSON

Structured data format for programmatic processing:

```json
{
  "metadata": {
    "scanDate": "2024-01-15T10:30:00Z",
    "fileCount": 3,
    "totalViolations": 12,
    "severityBreakdown": {
      "high": 2,
      "medium": 4,
      "low": 6
    },
    "categoryBreakdown": {
      "pii": 8,
      "bias": 4
    }
  },
  "results": [
    {
      "file": "data/conversations.json",
      "violations": [
        {
          "ruleId": "email",
          "message": "Detects email addresses",
          "match": "john.doe@example.com",
          "severity": "high",
          "category": "pii",
          "objectIndex": 0,
          "field": "user_email",
          "context": "Object 0, field: user_email"
        }
      ],
      "durationMs": 45
    }
  ]
}
```

### CSV

Spreadsheet-compatible format with summary rows:

```csv
File,Rule ID,Severity,Category,Match,Context,Message
data/conversations.json,email,high,pii,john.doe@example.com,Object 0 field: user_email,Detects email addresses
data/conversations.json,phone,medium,pii,555-123-4567,Object 1 field: contact,Detects phone numbers
SUMMARY,,,,,12 total violations,
SEVERITY_BREAKDOWN,high: 2,medium: 4,low: 6,,,
```

### HTML

Responsive web format with styling and interactivity:

```html
<!doctype html>
<html>
  <head>
    <title>PromptShield Security Report</title>
    <style>
      .severity-high {
        color: #dc3545;
        font-weight: bold;
      }
      .severity-medium {
        color: #fd7e14;
      }
      .severity-low {
        color: #28a745;
      }
    </style>
  </head>
  <body>
    <h1>PromptShield Scan Report</h1>
    <div class="metadata">
      <div class="metadata-grid">
        <div class="metadata-item">
          <strong>Scan Date:</strong><br />2024-01-15T10:30:00Z
        </div>
      </div>
    </div>
  </body>
</html>
```

### Table

ASCII table format for terminal display:

```
┌─────────────────────────┬─────────┬──────────┬──────────┬─────────────────────┬──────────────────────┐
│ File                    │ Rule ID │ Severity │ Category │ Match               │ Context              │
├─────────────────────────┼─────────┼──────────┼──────────┼─────────────────────┼──────────────────────┤
│ data/conversations.json │ email   │ high     │ pii      │ john.doe@example.co │ Object 0, field: us… │
│ data/conversations.json │ phone   │ medium   │ pii      │ 555-123-4567        │ Object 1, field: co… │
└─────────────────────────┴─────────┴──────────┴──────────┴─────────────────────┴──────────────────────┘
```

### NDJSON

Streaming newline-delimited JSON for large result sets:

```
{"file":"data/conversations.json","violations":[{"ruleId":"email","severity":"high",...}],"durationMs":45}
{"file":"data/prompts.json","violations":[{"ruleId":"bias","severity":"medium",...}],"durationMs":32}
```

### Output Features

**Streaming Support:**

- **Formats**: NDJSON, Markdown, CSV (when writing to files)
- **Benefits**: Memory efficiency, real-time processing
- **Activation**: Automatic above streaming threshold

**Compression:**

- **Types**: gzip, deflate
- **Levels**: 0-9 (default: 6)
- **Usage**: `--compress gzip --compression-level 9`

**Customization:**

- **Color output**: Enabled by default, disable with `--no-color`
- **Metadata inclusion**: Scan statistics and breakdowns
- **Progress indicators**: Optional with `--verbose`

---

## Built-in RulePacks

### PII RulePack (`rulepacks/pii.yaml`)

**Purpose:** Detect personally identifiable information in text data.

**Rules:**

| Rule ID            | Severity | Description                | Pattern Type    |
| ------------------ | -------- | -------------------------- | --------------- |
| `email`            | high     | Email addresses            | keyword + regex |
| `phone`            | medium   | US phone numbers           | regex           |
| `ssn`              | high     | US Social Security Numbers | regex           |
| `cc`               | high     | Credit card numbers        | regex           |
| `address_keywords` | medium   | Address-related keywords   | keyword         |
| `address_regex`    | medium   | US-style addresses         | regex           |
| `username`         | low      | Usernames and handles      | keyword + regex |

**Example Usage:**

```bash
# Scan for all PII
promptshield scan data.json --category pii

# High-severity PII only
promptshield scan data.json --category pii --severity high,critical

# Email and phone detection
promptshield scan data.json --rulepack rulepacks/pii.yaml --verbose
```

### Bias RulePack (`rulepacks/bias.yaml`)

**Purpose:** Identify biased language and discriminatory content.

**Rules:**

| Rule ID              | Severity | Description              | Pattern Type |
| -------------------- | -------- | ------------------------ | ------------ |
| `gender_bias`        | medium   | Gender-biased language   | keyword      |
| `racial_bias`        | high     | Racially biased language | keyword      |
| `age_bias`           | medium   | Age-based discrimination | keyword      |
| `socioeconomic_bias` | medium   | Socioeconomic bias       | keyword      |
| `ability_bias`       | high     | Ability/disability bias  | keyword      |
| `religious_bias`     | medium   | Religious bias           | keyword      |
| `stereotypes`        | medium   | Stereotypical phrases    | regex        |

**Example Usage:**

```bash
# Comprehensive bias scan
promptshield scan conversations.json --category bias

# High-severity bias only
promptshield scan responses.ndjson --category bias --severity high

# Specific bias types
promptshield scan data.json --rulepack rulepacks/bias.yaml --fields "response"
```

### Hallucination RulePack (`rulepacks/hallucination.yaml`)

**Purpose:** Detect potential AI hallucinations and inaccuracies.

**Status:** Framework ready - rules can be customized for specific domains.

**Example Usage:**

```bash
# Scan for hallucinations
promptshield scan ai_responses.json --category hallucination

# Custom hallucination rules
promptshield create medical-hallucination --template hallucination
```

---

## Enterprise Features

### Security and Compliance

**Data Protection:**

- No data transmission - all processing is local
- No data storage - results only stored where specified
- Configurable data retention policies
- GDPR/CCPA compliance support

**Access Control:**

- File system permissions respected
- No elevation of privileges required
- Secure temporary file handling
- Audit trail capabilities

**Compliance Reporting:**

- Detailed violation tracking
- Severity-based compliance scoring
- Historical trend analysis support
- Export formats for compliance systems

### Performance and Scalability

**Memory Management:**

- Real-time memory monitoring
- Configurable warning thresholds (default: 80%)
- Automatic garbage collection optimization
- Memory usage reporting

**Processing Optimization:**

- Streaming for large files (>1000 objects)
- Parallel processing for multiple files
- Configurable timeout protection
- Progress tracking and ETA

**Resource Limits:**

- Maximum object processing limits
- Configurable depth traversal limits
- Memory threshold warnings
- Timeout protection

### Monitoring and Observability

**Logging Levels:**

```bash
# Debug logging
promptshield scan data.json --debug

# Verbose output
promptshield scan data.json --verbose

# Quiet mode (errors only)
promptshield scan data.json --quiet
```

**Performance Metrics:**

- Processing duration tracking
- Memory usage statistics
- Throughput measurements
- Violation detection rates

**Error Handling:**

- Structured error reporting
- Graceful degradation
- Retry mechanisms for transient failures
- Detailed stack traces in debug mode

---

## CI/CD Integration

### Exit Codes

| Code | Meaning                                      | Usage             |
| ---- | -------------------------------------------- | ----------------- |
| 0    | Success - no violations above fail threshold | Continue pipeline |
| 1    | Violations found above fail threshold        | Fail pipeline     |
| 2    | Input/configuration error                    | Fix configuration |
| 3    | Processing error                             | Check logs, retry |

### Pipeline Integration Examples

#### GitHub Actions

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install PromptShield
        run: npm install -g promptshield

      - name: Scan for security violations
        run: |
          promptshield scan data/ \
            --fail-on medium \
            --output json \
            --output-file security-report.json \
            --quiet

      - name: Upload security report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-report
          path: security-report.json
```

#### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Security Scan') {
            steps {
                script {
                    sh 'npm install -g promptshield'

                    def exitCode = sh(
                        script: '''
                            promptshield scan datasets/ \
                                --rulepack enterprise/security.yaml \
                                --fail-on high \
                                --output html \
                                --output-file security-report.html \
                                --compress gzip
                        ''',
                        returnStatus: true
                    )

                    if (exitCode != 0) {
                        currentBuild.result = 'FAILURE'
                        error("Security violations found")
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'security-report.html.gz'
                }
            }
        }
    }
}
```

#### Docker Integration

```dockerfile
FROM node:18-alpine

# Install PromptShield
RUN npm install -g promptshield

# Copy data and rules
COPY data/ /app/data/
COPY rulepacks/ /app/rulepacks/

WORKDIR /app

# Run security scan
CMD ["promptshield", "scan", "data/", \
     "--rulepack", "rulepacks/enterprise.yaml", \
     "--fail-on", "medium", \
     "--output", "json", \
     "--output-file", "results.json"]
```

### Best Practices

**Development Environment:**

```bash
# Quick scan for development
promptshield scan src/ --severity high --quiet

# Detailed analysis
promptshield scan data/ --verbose --debug --output html --output-file dev-report.html
```

**Staging Environment:**

```bash
# Comprehensive pre-production scan
promptshield scan production-data/ \
  --rulepack enterprise/full.yaml \
  --fail-on medium \
  --output json \
  --output-file staging-report.json \
  --compress gzip
```

**Production Environment:**

```bash
# Production monitoring scan
promptshield scan live-data/ \
  --category pii,security \
  --severity critical \
  --fail-on critical \
  --timeout 600 \
  --memory-warning-threshold 0.9 \
  --quiet
```

---

## Performance & Scaling

### Memory Management

**Configuration:**

```bash
# Set memory warning threshold
promptshield scan large-dataset.ndjson --memory-warning-threshold 0.8

# Enable debug memory tracking
promptshield scan data.json --debug
```

**Memory Usage Patterns:**

- **Small files (<10MB)**: ~50-100MB RAM usage
- **Medium files (10-100MB)**: ~200-500MB RAM usage
- **Large files (>100MB)**: Streaming mode, ~100-200MB RAM usage
- **Batch processing**: Linear scaling with file count

**Optimization Strategies:**

- Use NDJSON for large datasets
- Enable streaming with `--streaming-threshold`
- Process files individually for very large batches
- Monitor memory usage with `--memory-warning-threshold`

### Processing Performance

**Throughput Benchmarks:**

- **JSON parsing**: ~50MB/s for structured data
- **Text scanning**: ~100MB/s for plain text
- **Rule matching**: ~1M objects/minute (varies by rule complexity)
- **Report generation**: ~10K violations/second

**Optimization Options:**

```bash
# Limit processing scope
promptshield scan data.json --max-objects 10000 --max-depth 3

# Optimize for speed
promptshield scan data.json --fields "prompt,response" --streaming-threshold 500

# Timeout protection
promptshield scan large-data/ --timeout 1800
```

### Scaling Strategies

**Horizontal Scaling:**

```bash
# Split large datasets
split -l 10000 large-dataset.ndjson chunk_
for chunk in chunk_*; do
  promptshield scan $chunk --output json --output-file results_${chunk}.json &
done
wait

# Combine results
cat results_*.json > combined_results.json
```

**Batch Processing:**

```bash
# Process directory efficiently
find data/ -name "*.json" -exec promptshield scan {} --output json --output-file {}.results \;

# Parallel processing with xargs
find data/ -name "*.json" | xargs -P 4 -I {} promptshield scan {} --quiet
```

---

## Customization

### Custom RulePacks

**RulePack Structure:**

```yaml
# custom-rules.yaml
name: 'Custom Security Rules'
version: '1.0.0'
description: 'Company-specific security rules'
category: 'security'
created: '2024-01-15'

rules:
  - id: 'api_key'
    name: 'API Key Detection'
    description: 'Detects API keys and tokens'
    severity: 'high'
    category: 'security'
    enabled: true
    match_keywords:
      - 'api_key'
      - 'access_token'
      - 'secret_key'
    match_regex:
      - "\\b[A-Z0-9]{32,}\\b"
      - 'sk-[a-zA-Z0-9]{48}'
    case_sensitive: false

  - id: 'internal_email'
    name: 'Internal Email Addresses'
    description: 'Company email addresses'
    severity: 'medium'
    category: 'pii'
    enabled: true
    match_regex:
      - "\\b[a-zA-Z0-9._%+-]+@company\\.com\\b"
    case_sensitive: false
```

**Usage:**

```bash
# Use custom RulePack
promptshield scan data.json --rulepack custom-rules.yaml

# Create from template
promptshield create custom-security --template security --force

# Validate custom RulePack
promptshield validate custom-rules.yaml --rulepack
```

### Schema Validation

**Built-in Schemas:**

- **basic**: Simple object validation
- **extended**: Comprehensive structure validation
- **flexible**: Loose validation for varied data

**Custom Schema Example:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["prompt", "response"],
    "properties": {
      "prompt": { "type": "string" },
      "response": { "type": "string" },
      "metadata": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" }
        }
      }
    }
  }
}
```

**Usage:**

```bash
# Validate against custom schema
promptshield scan data.json --schema custom-schema.json

# Built-in schema validation
promptshield validate data.json --schema extended
```

### Field Configuration

**Default Fields:**

```bash
# Default scanning fields
promptshield scan data.json  # Scans: prompt, response

# Custom fields
promptshield scan data.json --fields "user_input,ai_output,metadata"

# Scan entire object
promptshield scan data.json --scan-entire-object
```

**Nested Field Access:**

```bash
# Dot notation for nested fields
promptshield scan data.json --fields "user.message,bot.response,session.metadata"

# Array element access
promptshield scan data.json --fields "messages[0].content,messages[1].content"
```

---

## Troubleshooting

### Common Issues

#### Memory Issues

**Symptoms:** Process killed, out of memory errors
**Solutions:**

```bash
# Reduce memory usage
promptshield scan large-file.ndjson --streaming-threshold 100 --max-objects 1000

# Monitor memory usage
promptshield scan data.json --memory-warning-threshold 0.7 --debug

# Process in smaller chunks
split -l 1000 large-file.ndjson chunk_
for chunk in chunk_*; do promptshield scan $chunk; done
```

#### Performance Issues

**Symptoms:** Slow processing, timeouts
**Solutions:**

```bash
# Increase timeout
promptshield scan large-data/ --timeout 3600

# Limit processing depth
promptshield scan complex-data.json --max-depth 2

# Reduce rule complexity
promptshield scan data.json --category pii --severity high
```

#### Format Issues

**Symptoms:** Parse errors, invalid JSON
**Solutions:**

```bash
# Validate input format
promptshield validate data.json --schema basic

# Force NDJSON mode
promptshield scan data.jsonl --ndjson

# Debug parsing issues
promptshield scan problematic-file.json --debug
```

#### Rule Issues

**Symptoms:** No violations found, false positives
**Solutions:**

```bash
# List available rules
promptshield list --category pii

# Test custom RulePack
promptshield validate custom-rules.yaml --rulepack

# Debug rule matching
promptshield scan data.json --debug --verbose
```

### Debug Information

**Enable Debug Mode:**

```bash
promptshield scan data.json --debug --verbose
```

**Debug Output Includes:**

- Memory usage statistics
- Processing performance metrics
- Rule matching details
- File parsing information
- Error stack traces

**Log Analysis:**

```bash
# Capture debug output
promptshield scan data.json --debug 2> debug.log

# Filter specific issues
promptshield scan data.json --debug 2>&1 | grep -E "(ERROR|WARN)"
```

### Support and Resources

**Getting Help:**

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this comprehensive guide
- **Community**: Join discussions and share experiences
- **Enterprise Support**: Contact for enterprise licensing

**Error Reporting:**
Include the following information:

- PromptShield version (`promptshield --version`)
- Node.js version (`node --version`)
- Command executed
- Input file structure (sanitized)
- Complete error output with `--debug`

---

## API Reference

### Exit Codes

| Code | Description                           | Recommended Action                          |
| ---- | ------------------------------------- | ------------------------------------------- |
| 0    | Success                               | Continue processing                         |
| 1    | Violations found above fail threshold | Review violations, update data or rules     |
| 2    | Configuration error                   | Fix command line options or file paths      |
| 3    | Processing error                      | Check input format, increase memory/timeout |
| 4    | Validation error                      | Fix input data structure                    |
| 5    | RulePack error                        | Validate RulePack syntax                    |

### Environment Variables

```bash
# Custom configuration
export PROMPTSHIELD_CONFIG_DIR="/etc/promptshield"
export PROMPTSHIELD_RULEPACK_DIR="/opt/rulepacks"
export PROMPTSHIELD_LOG_LEVEL="debug"
export PROMPTSHIELD_MAX_MEMORY="2G"

# CI/CD integration
export PROMPTSHIELD_FAIL_ON="medium"
export PROMPTSHIELD_OUTPUT_FORMAT="json"
export PROMPTSHIELD_QUIET="true"
```

### Output Schema

**JSON Output Structure:**

```typescript
interface ScanResult {
  metadata: {
    scanDate: string; // ISO 8601 timestamp
    fileCount: number; // Files processed
    totalViolations: number; // Total violations found
    severityBreakdown: {
      // Violations by severity
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    categoryBreakdown: {
      // Violations by category
      [category: string]: number;
    };
    options?: {
      // Applied options
      maxViolations?: number;
      offset?: number;
      limit?: number;
    };
  };
  results: Array<{
    file: string; // File path
    violations: Array<{
      ruleId: string; // Rule identifier
      message: string; // Rule description
      match: string; // Matched content
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: string; // Rule category
      objectIndex?: number; // Object index in array
      field?: string; // Field name where match found
      lineNumber?: number; // Line number for text files
      context?: string; // Human-readable context
    }>;
    durationMs: number; // Processing time
  }>;
}
```

### Rule Definition Schema

**RulePack YAML Structure:**

```yaml
name: string                    # RulePack name
version: string                 # Semantic version
description: string             # Human-readable description
category: string                # Primary category
created: string                 # Creation date (YYYY-MM-DD)

rules:
  - id: string                  # Unique rule identifier
    name: string                # Human-readable name
    description: string         # Rule purpose
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string            # Rule category
    enabled: boolean            # Rule activation status
    match_keywords?: string[]   # Keywords to match
    match_regex?: string[]      # Regex patterns to match
    case_sensitive?: boolean    # Case sensitivity (default: false)
```

**Supported Categories:**

- `pii` - Personally Identifiable Information
- `bias` - Language bias and discrimination
- `hallucination` - AI inaccuracies
- `security` - Security vulnerabilities
- `compliance` - Regulatory compliance
- `custom` - Organization-specific rules

**Severity Guidelines:**

- **critical**: Immediate action required, security risk
- **high**: Important issue, should be addressed soon
- **medium**: Moderate concern, review recommended
- **low**: Minor issue, informational

---

## Conclusion

PromptShield provides enterprise-grade security scanning for AI/ML data with comprehensive rule management, flexible output formats, and robust CI/CD integration. The tool is designed to scale from individual development workflows to enterprise-wide security compliance programs.

For additional support, custom rule development, or enterprise licensing, please contact the PromptShield team.

**Version:** 1.0.0
**Last Updated:** 2024-01-15
**License:** MIT
**Repository:** https://github.com/your-org/promptshield
