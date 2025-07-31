# 📋 CLI Reference

Complete command-line interface reference for PromptShield.

## 📋 Table of Contents

- [Overview](#overview)
- [Global Options](#global-options)
- [Commands](#commands)
- [Examples](#examples)
- [Exit Codes](#exit-codes)

## 🎯 Overview

PromptShield provides a command-line interface for scanning AI content for security risks and compliance violations. All commands support help with `--help`.

```bash
promptshield --help
promptshield <command> --help
```

## 🌐 Global Options

These options are available for all commands:

| Option       | Description              | Default |
| ------------ | ------------------------ | ------- |
| `--version`  | Show version information | -       |
| `--help`     | Show help for command    | -       |
| `--debug`    | Enable debug mode        | false   |
| `--verbose`  | Enable verbose output    | false   |
| `--quiet`    | Suppress progress output | false   |
| `--no-color` | Disable colored output   | false   |

## 📚 Commands

### 🔍 `scan` - Scan Files for Violations

The main command for scanning files, directories, or content for security violations.

```bash
promptshield scan <input> [options]
```

#### Arguments

| Argument  | Description                       | Required |
| --------- | --------------------------------- | -------- |
| `<input>` | File, directory, or `-` for stdin | Yes      |

#### Core Options

| Option                     | Description                     | Default    | Type   |
| -------------------------- | ------------------------------- | ---------- | ------ |
| `-r, --rulepack <path>`    | Path to RulePack YAML (required)| -          | string |
| `-o, --output <format>`    | Output format                   | `markdown` | string |
| `-f, --output-file <file>` | Write to file instead of stdout | -          | string |

**Output Formats:**

- `json` - Structured JSON data
- `markdown` - Human-readable markdown
- `csv` - Spreadsheet-friendly CSV
- `html` - Web-ready HTML
- `table` - Terminal-friendly tables
- `ndjson` - Newline-delimited JSON

#### Filtering Options

| Option                      | Description                            | Default                    | Type   |
| --------------------------- | -------------------------------------- | -------------------------- | ------ |
| `--severity <levels>`       | Filter by severity (comma-separated)   | `low,medium,high,critical` | string |
| `--category <categories>`   | Filter by categories (comma-separated) | -                          | string |
| `--max-violations <number>` | Maximum violations to report           | -                          | number |
| `--offset <number>`         | Pagination offset                      | 0                          | number |
| `--limit <number>`          | Pagination limit                       | -                          | number |

**Severity Levels:**

- `critical` - Immediate security risk
- `high` - Significant violation
- `medium` - Moderate concern
- `low` - Minor issue

**Categories:**

- `security` - Prompt injections, jailbreaks
- `pii` - Personal information
- `bias` - Discriminatory content
- `compliance` - Regulatory violations
- `custom` - Custom categories

#### Processing Options

| Option                   | Description                       | Default                   | Type    |
| ------------------------ | --------------------------------- | ------------------------- | ------- |
| `--fields <fields>`      | Fields to scan (comma-separated)  | `prompt,response,content` | string  |
| `--scan-entire-object`   | Also scan entire object as string | false                     | boolean |
| `--max-objects <number>` | Maximum objects to process        | -                         | number  |
| `--max-depth <number>`   | Max nested object depth           | 4                         | number  |
| `--schema <schema>`      | JSON schema validation            | -                         | string  |

#### Performance Options

| Option                                | Description                        | Default | Type           |
| ------------------------------------- | ---------------------------------- | ------- | -------------- |
| `--ndjson`                            | Force NDJSON mode                  | false   | boolean        |
| `--streaming-threshold <number>`      | Threshold for streaming mode       | 1000    | number         |
| `--parallel [workers]`                | Enable parallel processing         | false   | boolean/number |
| `--batch-size <number>`               | Batch size for parallel processing | 10      | number         |
| `--timeout <seconds>`                 | Processing timeout                 | 300     | number         |
| `--memory-warning-threshold <number>` | Memory warning threshold (0-1)     | 0.8     | number         |

#### Compression Options

| Option                        | Description             | Default | Type   |
| ----------------------------- | ----------------------- | ------- | ------ |
| `--compress <type>`           | Output compression      | -       | string |
| `--compression-level <level>` | Compression level (0-9) | 6       | number |

**Compression Types:**

- `gzip` - Gzip compression
- `deflate` - Deflate compression

#### Output Control Options

| Option                 | Description                   | Default | Type    |
| ---------------------- | ----------------------------- | ------- | ------- |
| `-q, --quiet`          | Suppress progress and summary | false   | boolean |
| `-v, --verbose`        | Enable verbose output         | false   | boolean |
| `--strict`             | Treat warnings as errors      | false   | boolean |
| `--fail-on <severity>` | Exit with error on severity   | -       | string  |

#### Examples

```bash
# Basic scan (rulepack required)
promptshield scan data.json -r my-rules.yaml

# Scan with filtering
promptshield scan data.json -r my-rules.yaml --severity critical,high

# Scan with custom output
promptshield scan data.json -r my-rules.yaml --output json --output-file report.json

# Scan with performance options
promptshield scan large-file.json -r my-rules.yaml --parallel 4 --streaming-threshold 100

# Scan from stdin
echo '{"prompt": "test"}' | promptshield scan - -r my-rules.yaml

# CI/CD integration
promptshield scan data.json -r security-rules.yaml --fail-on critical --quiet
```

### 📋 `list` - List Rules in a RulePack

View rules in a specific RulePack.

```bash
promptshield list [options]
```

#### Options

| Option                  | Description                       | Default | Type    |
| ----------------------- | --------------------------------- | ------- | ------- |
| `-r, --rulepack <path>` | Path to RulePack YAML (required)  | -       | string  |
| `--category <category>` | Filter by category                | -       | string  |
| `--severity <severity>` | Filter by severity                | -       | string  |
| `--enabled-only`        | Show only enabled rules           | false   | boolean |

#### Examples

```bash
# List rules in your RulePack
promptshield list -r my-rules.yaml

# List with filters
promptshield list -r my-rules.yaml --category security --enabled-only

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

#### Arguments

| Argument     | Description                  | Required |
| ------------ | ---------------------------- | -------- |
| `<filename>` | Output filename for RulePack | Yes      |

#### Options

| Option                            | Description                    | Default  | Type    |
| --------------------------------- | ------------------------------ | -------- | ------- |
| `-t, --template <template>`       | Template to use                | `basic`  | string  |
| `-d, --description <description>` | RulePack description           | -        | string  |
| `-c, --category <category>`       | RulePack category              | `custom` | string  |
| `--force`                         | Overwrite existing file        | false    | boolean |
| `-v, --verbose`                   | Show detailed rule information | false    | boolean |
| `-q, --quiet`                     | Suppress output messages       | false    | boolean |

**Templates Available:**

- `basic` - Simple starter template
- `security` - AI security and prompt injection rules
- `pii` - Personal information detection
- `bias` - Bias and discrimination detection
- `compliance` - GDPR, HIPAA, SOX compliance

#### Examples

```bash
# Create basic template
promptshield init my-rules.yaml

# Create security rules
promptshield init security-rules.yaml --template security

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

#### Arguments

| Argument   | Description                   | Required |
| ---------- | ----------------------------- | -------- |
| `<target>` | File or directory to validate | Yes      |

#### Options

| Option                  | Description                   | Default | Type    |
| ----------------------- | ----------------------------- | ------- | ------- |
| `--strict`              | Enable strict validation mode | false   | boolean |
| `-v, --verbose`         | Enable verbose output         | false   | boolean |
| `--skip-warnings`       | Skip warnings in output       | false   | boolean |
| `--max-errors <number>` | Maximum errors to report      | -       | number  |
| `--format <format>`     | Expected file format          | -       | string  |
| `--output <format>`     | Output format                 | `table` | string  |
| `--batch`               | Enable batch validation mode  | false   | boolean |

**File Formats:**

- `json` - JSON files
- `ndjson` - Newline-delimited JSON
- `yaml` - YAML files
- `txt` - Text files

**Output Formats:**

- `json` - Structured JSON
- `table` - Formatted table
- `summary` - Summary only

#### Examples

```bash
# Validate RulePack
promptshield validate rulepacks/security.yaml

# Validate input file
promptshield validate data.json

# Validate with strict mode
promptshield validate rulepack.yaml --strict

# Batch validation
promptshield validate /rulepacks/ --batch

# Validate with custom format
promptshield validate data.json --format json --output summary
```

## 📊 Examples

### Basic Workflows

#### Security Scanning

```bash
# Scan for prompt injection attacks
promptshield scan chat-logs.json --rulepack my-security-rules.yaml

# Scan with critical severity only
promptshield scan data.json -r my-rules.yaml --severity critical --output json --output-file critical-violations.json

# Scan directory with parallel processing
promptshield scan /data/ --parallel 4 --rulepack my-security-rules.yaml
```

#### PII Detection

```bash
# Scan for personal information
promptshield scan user-data.json --rulepack my-pii-rules.yaml

# Filter by PII category
promptshield scan data.json -r my-rules.yaml --category pii --severity high,critical

# Generate CSV report
promptshield scan data.json -r my-rules.yaml --output csv --output-file pii-report.csv
```

#### Compliance Checking

```bash
# Scan for compliance violations
promptshield scan data.json --rulepack my-compliance-rules.yaml

# Generate HTML report for stakeholders
promptshield scan data.json -r my-rules.yaml --output html --output-file compliance-report.html

# Fail on high severity violations
promptshield scan data.json -r my-rules.yaml --fail-on high --quiet
```

### Advanced Workflows

#### Large File Processing

```bash
# Use streaming for large files
promptshield scan huge-file.json --streaming-threshold 100

# Process with parallel workers
promptshield scan large-data.json --parallel 8 --batch-size 20

# Monitor memory usage
promptshield scan data.json --memory-warning-threshold 0.7
```

#### Custom Rule Development

```bash
# Create new RulePack
promptshield init my-rules.yaml --template security

# Validate the RulePack
promptshield validate my-rules.yaml --strict

# Test the RulePack
promptshield scan test-data.json --rulepack my-rules.yaml
```

#### CI/CD Integration

```bash
# Automated security scan
promptshield scan /data/ \
  --rulepack my-security-rules.yaml \
  --output json \
  --output-file security-report.json \
  --fail-on critical \
  --quiet

# Batch processing multiple files
for file in data/*.json; do
  promptshield scan "$file" \
    --rulepack my-rules.yaml \
    --output json \
    --output-file "report-$(basename "$file")"
done
```

#### Monitoring and Alerting

```bash
# Daily security scan
promptshield scan /daily-data/ \
  --rulepack my-security-rules.yaml \
  --output json \
  --output-file "/reports/daily-$(date +%Y%m%d).json"

# Weekly compliance report
promptshield scan /weekly-data/ \
  --rulepack my-compliance-rules.yaml \
  --output markdown \
  --output-file "/reports/weekly-$(date +%Y%m%d).md"
```

#### Exit Codes

PromptShield uses the following exit codes:

| Code | Description                                                    |
| ---- | -------------------------------------------------------------- |
| `0`  | Success - no violations or violations below fail threshold     |
| `1`  | Error - command failed or validation errors                    |
| `2`  | Violations found above fail threshold (when using `--fail-on`) |

### Examples

```bash
# Exit with error on critical violations
promptshield scan data.json --fail-on critical
echo $?  # 2 if critical violations found, 0 otherwise

# Normal scan
promptshield scan data.json
echo $?  # 0 (success) regardless of violations

# Invalid command
promptshield invalid-command
echo $?  # 1 (error)
```

## 🔧 Environment Variables

PromptShield respects the following environment variables:

| Variable    | Description      | Default      |
| ----------- | ---------------- | ------------ |
| `LOG_LEVEL` | Logging level    | `INFO`       |
| `NODE_ENV`  | Environment mode | `production` |

## 📝 Configuration Files

PromptShield can be configured through:

1. **Command-line options** (highest priority)
2. **Environment variables**
3. **Default values** (lowest priority)

## 🆘 Getting Help

```bash
# General help
promptshield --help

# Command-specific help
promptshield scan --help
promptshield list --help
promptshield init --help
promptshield validate --help

# Version information
promptshield --version
```

---

**📋 Complete CLI reference for PromptShield!**

For more information, see:

- [User Guide](USER_GUIDE.md) - Complete usage guide
- [RulePack Guide](RULEPACK_GUIDE.md) - Create custom rules
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Solve common issues
