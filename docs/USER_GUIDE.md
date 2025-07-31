# 📖 User Guide

Complete guide to using PromptShield for AI security scanning and compliance monitoring.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Commands](#commands)
- [RulePacks](#rulepacks)
- [Output Formats](#output-formats)
- [Performance](#performance)
- [Best Practices](#best-practices)

## 🎯 Overview

PromptShield is an AI security scanner that detects prompt injections, PII leaks, and compliance violations in your LLM content. It uses RulePacks - YAML files containing detection rules - to scan JSON, NDJSON, and text files.

### Key Features

- **🛡️ AI Security Focus**: Detects prompt injections, jailbreaks, and system prompt extraction
- **📦 RulePack System**: Modular YAML-based rule definitions
- **🚀 High Performance**: Streaming and parallel processing for large files
- **📊 Multiple Outputs**: JSON, Markdown, CSV, HTML, Table, NDJSON formats
- **🔒 Privacy First**: Runs completely offline - no data leaves your system

## 📥 Installation

### Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0

### Global Installation (Recommended)

```bash
npm install -g promptshield

# Verify installation
promptshield --version
```

### Project Installation

```bash
npm install promptshield --save-dev

# Add to package.json scripts
{
  "scripts": {
    "security:scan": "promptshield scan data/ --rulepack rulepacks/security.yaml",
    "security:validate": "promptshield validate rulepacks/"
  }
}
```

## 🧠 Core Concepts

### RulePacks

RulePacks are YAML files containing detection rules. Each rule defines:

- **Patterns**: Regex or keyword patterns to match
- **Severity**: Critical, high, medium, or low
- **Category**: Security, PII, bias, compliance, etc.
- **Description**: What the rule detects

### Scan Process

1. **Input**: File or directory to scan
2. **Processing**: Parse content and extract fields
3. **Rule Matching**: Apply rules to content
4. **Output**: Generate report in chosen format

### Supported File Types

- **JSON**: Arrays of objects with fields like `prompt`, `response`
- **NDJSON**: Newline-delimited JSON for large datasets
- **Text**: Plain text files for direct content scanning

## 📚 Commands

### 🔍 `scan` - Main Scanning Command

Scan files, directories, or content for violations.

```bash
promptshield scan <input> [options]
```

**Basic Usage:**

```bash
# Scan a single file
promptshield scan data.json

# Scan with specific RulePack
promptshield scan data.json --rulepack rulepacks/pii.yaml

# Scan directory
promptshield scan /path/to/data/

# Scan with custom output
promptshield scan data.json --output json --output-file report.json
```

**Advanced Options:**

```bash
# Filtering
--severity critical,high          # Filter by severity levels
--category security,pii           # Filter by categories
--max-violations 100             # Limit violations reported
--offset 0 --limit 50            # Pagination

# Processing
--fields prompt,response          # Scan specific fields only
--scan-entire-object             # Also scan entire object as string
--max-objects 1000               # Limit objects processed
--max-depth 4                    # Nested object depth limit

# Performance
--parallel 4                     # Enable parallel processing
--streaming-threshold 1000       # Threshold for streaming mode
--batch-size 10                  # Batch size for parallel processing
--timeout 300                    # Processing timeout in seconds
--memory-warning-threshold 0.8   # Memory warning threshold

# Output Control
--output json|markdown|csv|html|table|ndjson
--output-file report.json        # Save to file
--compress gzip                  # Compress output
--quiet                          # Suppress progress output
--verbose                        # Enable verbose output
--fail-on critical               # Exit with error on severity
```

### 📋 `list` - List Rules and RulePacks

View available RulePacks and their rules.

```bash
promptshield list [options]
```

**Examples:**

```bash
# List all RulePacks
promptshield list

# List rules in specific RulePack
promptshield list --rulepack rulepacks/security.yaml

# Filter by category
promptshield list --category security --enabled-only

# Filter by severity
promptshield list --severity critical,high
```

### 📝 `init` - Create New RulePack

Initialize a new RulePack from templates.

```bash
promptshield init <filename> [options]
```

**Templates Available:**

- `basic` - Simple starter template
- `security` - AI security and prompt injection rules
- `pii` - Personal information detection
- `bias` - Bias and discrimination detection
- `compliance` - GDPR, HIPAA, SOX compliance

**Examples:**

```bash
# Create security rules
promptshield init my-security.yaml --template security

# Create with description
promptshield init gdpr-rules.yaml --template compliance --description "GDPR compliance rules"

# Create with verbose output
promptshield init custom-rules.yaml --template basic --verbose
```

### ✅ `validate` - Validate Files and RulePacks

Validate RulePacks and input files for correctness.

```bash
promptshield validate <target> [options]
```

**Examples:**

```bash
# Validate RulePack
promptshield validate rulepacks/security.yaml

# Validate input file
promptshield validate data.json

# Validate with strict mode
promptshield validate rulepack.yaml --strict

# Batch validation
promptshield validate /rulepacks/ --batch
```

## 📦 RulePacks

### Built-in RulePacks

#### Prompt Injection Detection

```bash
promptshield scan data.json --rulepack rulepacks/prompt-injection.yaml
```

Detects:

- DAN jailbreak attempts
- Role-playing attacks
- System prompt extraction
- Instruction bypass attempts
- Code execution attempts

#### PII Detection

```bash
promptshield scan data.json --rulepack rulepacks/pii.yaml
```

Detects:

- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- Physical addresses

#### Bias Detection

```bash
promptshield scan data.json --rulepack rulepacks/bias.yaml
```

Detects:

- Discriminatory language
- Gender bias
- Racial bias
- Age discrimination
- Stereotyping

### Creating Custom RulePacks

#### Basic Rule Structure

```yaml
version: '1.0.0'
last_updated: '2025-01-15'
name: 'My Custom Rules'
description: 'Custom detection rules for my organization'
rules:
  - id: 'custom-pattern'
    description: 'Detects my custom pattern'
    match_regex: ['\\bmy-pattern\\b']
    severity: 'high'
    category: 'security'
    enabled: true
    case_sensitive: false
```

#### Rule Types

**Regex Patterns:**

```yaml
rules:
  - id: 'api-key'
    description: 'Detects API keys'
    match_regex: ['\\b[A-Z0-9]{32}\\b']
    severity: 'critical'
    category: 'security'
    enabled: true
```

**Keyword Matching:**

```yaml
rules:
  - id: 'internal-urls'
    description: 'Detects internal URLs'
    match_keywords:
      - 'internal.company.com'
      - 'staging.company.com'
    severity: 'medium'
    category: 'security'
    enabled: true
    case_sensitive: false
```

**Combined Patterns:**

```yaml
rules:
  - id: 'sensitive-data'
    description: 'Detects sensitive information'
    match_regex: ['\\b(?:password|secret|key)\\s*[:=]\\s*["\']?[a-zA-Z0-9]{16,}["\']?']
    match_keywords:
      - 'password'
      - 'secret'
      - 'api_key'
    severity: 'critical'
    category: 'security'
    enabled: true
```

## 📊 Output Formats

### JSON Output

```bash
promptshield scan data.json --output json
```

Structured data for automation and integration:

```json
{
  "summary": {
    "total_violations": 2,
    "by_severity": { "critical": 1, "high": 1 },
    "by_category": { "security": 2 }
  },
  "violations": [
    {
      "rule_id": "api-key",
      "rule_description": "Detects API keys",
      "severity": "critical",
      "category": "security",
      "message": "API key found in prompt",
      "field": "prompt",
      "object_index": 0,
      "position": { "start": 45, "end": 77 },
      "context": { "match": "sk-1234567890abcdef" }
    }
  ],
  "metrics": {
    "objects_scanned": 100,
    "processing_time_ms": 150,
    "memory_usage_bytes": 52428800
  }
}
```

### Markdown Output

```bash
promptshield scan data.json --output markdown
```

Human-readable reports with formatting:

```markdown
# PromptShield Scan Report

## Summary

**Total Violations:** 2

### By Severity

🔴 **critical:** 1
🟠 **high:** 1

### By Category

- **security:** 2

## Violations

### 🔴 api-key

**Description:** Detects API keys
**Severity:** critical
**Category:** security
**Message:** API key found in prompt
**Field:** prompt
**Context:**
```

sk-1234567890abcdef

```

```

### CSV Output

```bash
promptshield scan data.json --output csv
```

Spreadsheet-friendly format:

```csv
rule_id,severity,category,message,field,object_index
api-key,critical,security,API key found in prompt,prompt,0
email,high,pii,Email address found,response,1
```

### HTML Output

```bash
promptshield scan data.json --output html
```

Web-ready reports with styling and interactivity.

### Table Output

```bash
promptshield scan data.json --output table
```

Terminal-friendly formatted tables:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PromptShield Scan Report                            │
└─────────────────────────────────────────────────────────────────────────────────┘

📊 SUMMARY
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Metric              │ Value                                                   │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Total Violations    │ 2                                                       │
│ Objects Scanned     │ 100                                                     │
│ Processing Time     │ 150ms                                                   │
└─────────────────────┴─────────────────────────────────────────────────────────┘
```

### NDJSON Output

```bash
promptshield scan data.json --output ndjson
```

Streaming-friendly format for large datasets:

```json
{"type":"summary","total_violations":2,"by_severity":{"critical":1,"high":1}}
{"type":"violation","rule_id":"api-key","severity":"critical","category":"security"}
{"type":"violation","rule_id":"email","severity":"high","category":"pii"}
```

## ⚡ Performance

### Streaming Mode

For large files (>100MB), enable streaming:

```bash
promptshield scan large-file.json --streaming-threshold 100
```

### Parallel Processing

Use multiple CPU cores:

```bash
promptshield scan data.json --parallel 4
```

### Memory Management

Monitor memory usage:

```bash
promptshield scan data.json --memory-warning-threshold 0.7
```

### Batch Processing

Process files in batches:

```bash
promptshield scan data.json --batch-size 20
```

## 🎯 Best Practices

### File Organization

```
project/
├── data/
│   ├── prompts.json
│   └── responses.json
├── rulepacks/
│   ├── security.yaml
│   ├── pii.yaml
│   └── custom.yaml
└── reports/
    └── security-report.json
```

### CI/CD Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install PromptShield
        run: npm install -g promptshield
      - name: Run Security Scan
        run: |
          promptshield scan data/ \
            --rulepack rulepacks/security.yaml \
            --output json \
            --output-file security-report.json \
            --fail-on critical
```

### Regular Scanning

```bash
# Daily security scan
0 2 * * * promptshield scan /data/ --rulepack rulepacks/security.yaml --output json --output-file /reports/daily-security-$(date +%Y%m%d).json

# Weekly compliance scan
0 3 * * 1 promptshield scan /data/ --rulepack rulepacks/compliance.yaml --output markdown --output-file /reports/weekly-compliance-$(date +%Y%m%d).md
```

### Rule Development

1. **Start with templates**: Use `promptshield init` with appropriate template
2. **Test thoroughly**: Validate rules with known good and bad examples
3. **Iterate**: Refine patterns based on false positives/negatives
4. **Document**: Include clear descriptions and examples in rules

### Performance Optimization

1. **Use streaming** for files >100MB
2. **Enable parallel processing** for multi-core systems
3. **Filter results** to focus on relevant violations
4. **Monitor memory usage** for large datasets
5. **Use NDJSON** for very large datasets

---

**🛡️ Ready to secure your AI content with PromptShield!**

For more information, see:

- [CLI Reference](CLI_REFERENCE.md) - Complete command documentation
- [RulePack Guide](RULEPACK_GUIDE.md) - Create custom detection rules
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Solve common issues
