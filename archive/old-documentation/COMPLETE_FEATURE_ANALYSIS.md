# PromptShield Complete Feature Analysis

## CLI Commands Overview

### **3 Core Commands for v1.0 (Simplified)**

1. **`promptshield scan <input>`** - Main LLM output scanning
2. **`promptshield list`** - List available RulePacks and rules
3. **`promptshield init <filename>`** - Create YAML files with proper schema + templates

### **Disabled Commands (to be removed)**

4. ~~`promptshield create <name>`~~ - Redundant with init
5. ~~`promptshield validate <input>`~~ - Users get schema errors naturally
6. ~~`promptshield test <input>`~~ - Users test by scanning actual files
7. ~~`promptshield update`~~ - Already disabled for v1.0.0

---

## **1. Scan Command Options** (`promptshield scan <input>`)

### **Core Options**

| Option                 | Type   | Default  | Description                                             |
| ---------------------- | ------ | -------- | ------------------------------------------------------- |
| `--rulepack <path>`    | string | default  | Path to RulePack YAML                                   |
| `--output <format>`    | string | markdown | Output format: json, markdown, csv, table, html, ndjson |
| `--output-file <file>` | string | stdout   | Write report to file instead of stdout                  |

### **Filtering Options**

| Option                      | Type   | Default   | Description                                                      |
| --------------------------- | ------ | --------- | ---------------------------------------------------------------- |
| `--severity <levels>`       | string | all       | Filter by severity: low,medium,high,critical                     |
| `--category <categories>`   | string | all       | Filter by categories: pii,bias,hallucination,security,compliance |
| `--max-violations <number>` | number | unlimited | Maximum violations to report                                     |
| `--offset <number>`         | number | 0         | Pagination offset                                                |
| `--limit <number>`          | number | all       | Pagination limit                                                 |

### **Processing Options**

| Option                   | Type    | Default         | Description                                            |
| ------------------------ | ------- | --------------- | ------------------------------------------------------ |
| `--fields <fields>`      | string  | prompt,response | Fields to scan (comma-separated)                       |
| `--scan-entire-object`   | boolean | false           | Also scan entire object as string                      |
| `--max-objects <number>` | number  | unlimited       | Maximum objects to process                             |
| `--max-depth <number>`   | number  | 4               | Maximum nested object depth                            |
| `--schema <schema>`      | string  | universal       | JSON schema: basic, extended, flexible, or custom file |

### **Performance Options**

| Option                                | Type           | Default | Description                        |
| ------------------------------------- | -------------- | ------- | ---------------------------------- |
| `--ndjson`                            | boolean        | false   | Force NDJSON mode                  |
| `--streaming-threshold <number>`      | number         | 1000    | Threshold for streaming mode       |
| `--parallel [workers]`                | string/boolean | false   | Enable parallel processing         |
| `--batch-size <number>`               | number         | 10      | Batch size for parallel processing |
| `--timeout <seconds>`                 | number         | 300     | Processing timeout                 |
| `--memory-warning-threshold <number>` | number         | 0.8     | Memory usage warning (0.0-1.0)     |

### **Compression Options**

| Option                        | Type   | Default | Description                      |
| ----------------------------- | ------ | ------- | -------------------------------- |
| `--compress <type>`           | string | none    | Compress output: gzip or deflate |
| `--compression-level <level>` | number | 6       | Compression level (0-9)          |

### **Output Control**

| Option                 | Type    | Default | Description                                |
| ---------------------- | ------- | ------- | ------------------------------------------ |
| `--quiet`              | boolean | false   | Suppress progress output                   |
| `--verbose`            | boolean | false   | Enable verbose output                      |
| `--debug`              | boolean | false   | Enable debug mode                          |
| `--no-color`           | boolean | false   | Disable colored output                     |
| `--strict`             | boolean | false   | Treat warnings as errors                   |
| `--fail-on <severity>` | string  | none    | Fail on severity: low,medium,high,critical |

---

## **2. List Command Options** (`promptshield list`)

| Option                  | Type    | Default | Description                       |
| ----------------------- | ------- | ------- | --------------------------------- |
| `--rulepack <path>`     | string  | none    | List rules from specific RulePack |
| `--category <category>` | string  | all     | Filter by category                |
| `--severity <severity>` | string  | all     | Filter by severity                |
| `--enabled-only`        | boolean | false   | Show only enabled rules           |

---

## **3. Init Command Options** (`promptshield init <filename>`)

| Option                        | Type    | Default | Description                                      |
| ----------------------------- | ------- | ------- | ------------------------------------------------ |
| `--template <template>`       | string  | basic   | Template: basic, pii, bias, security, compliance |
| `--description <description>` | string  | none    | RulePack description                             |
| `--category <category>`       | string  | custom  | RulePack category                                |
| `--force`                     | boolean | false   | Overwrite existing file                          |
| `--verbose`                   | boolean | false   | Show detailed rule information                   |
| `--quiet`                     | boolean | false   | Suppress output messages                         |

---

## **RulePack YAML Schema**

### **Top-Level Fields**

```yaml
version: '1.0.0' # (optional) Semantic version
last_updated: '2025-01-15' # (optional) Date YYYY-MM-DD
name: 'RulePack Name' # (required) Human-readable name
description: 'RulePack description' # (required) Brief description
rules: # (required) Array of rules
  -  # Rule definitions below
```

### **Rule Schema**

```yaml
- id: 'unique_rule_id' # (required) Unique identifier
  description: 'What this rule detects' # (required) Rule description

  # At least one matching method required:
  match_regex: # (optional) Array of regex patterns
    - '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
  match_keywords: # (optional) Array of keywords
    - 'keyword1'
    - 'keyword2'

  # Optional fields:
  severity: 'medium' # (optional) low|medium|high|critical
  category: 'pii' # (optional) pii|bias|hallucination|security|compliance|parse|internal|custom
  enabled: true # (optional) boolean, default: true
  case_sensitive: false # (optional) boolean, default: false
```

### **Complete Example**

```yaml
version: '1.0.0'
last_updated: '2025-01-15'
name: 'PII Detection RulePack'
description: 'Detects personally identifiable information in LLM outputs'
rules:
  - id: 'email_addresses'
    description: 'Detects email addresses'
    match_regex:
      - '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
    severity: 'medium'
    category: 'pii'
    enabled: true
    case_sensitive: false

  - id: 'phone_numbers'
    description: 'Detects US phone numbers'
    match_regex:
      - '\\b\\d{3}-\\d{3}-\\d{4}\\b'
      - '\\(\\d{3}\\)\\s?\\d{3}-\\d{4}'
    severity: 'high'
    category: 'pii'
    enabled: true
```

---

## **Template Details**

### **1. Basic Template**

- **Purpose**: Simple starter template
- **Rules**: 2 example rules (keyword + regex)
- **Category**: custom
- **Example**: Email detection, keyword matching

### **2. PII Template**

- **Purpose**: Personal Identifiable Information detection
- **Rules**: Email, phone numbers, SSN patterns
- **Category**: pii
- **Severity**: Medium to high

### **3. Security Template**

- **Purpose**: Security vulnerability detection
- **Rules**: API keys, passwords, tokens, secrets
- **Category**: security
- **Severity**: High to critical

### **4. Bias Template**

- **Purpose**: Bias and fairness detection
- **Rules**: Gender bias, age bias, stereotypes
- **Category**: bias
- **Severity**: Low to medium

### **5. Compliance Template**

- **Purpose**: Regulatory compliance
- **Rules**: GDPR terms, HIPAA terms, SOX financial
- **Category**: compliance
- **Severity**: Medium to high

---

## **Input Data Schema**

### **Expected JSON Structure**

```json
[
  {
    "prompt": "User's input prompt", // Required
    "response": "LLM's response", // Required
    "any_other_field": "additional data" // Optional
  }
]
```

### **Supported File Formats**

- **JSON**: Regular JSON arrays
- **NDJSON**: Newline-delimited JSON (one object per line)
- **TXT**: Plain text files

---

## **Output Formats**

1. **json** - Structured JSON for programmatic use
2. **markdown** - Human-readable reports
3. **csv** - Spreadsheet-compatible
4. **table** - Console table display
5. **html** - Web-viewable reports
6. **ndjson** - Streaming newline-delimited JSON

---

## **Enterprise Features**

### **Performance & Scalability**

- Streaming mode for large files (1000+ objects)
- Parallel processing with configurable workers
- Memory monitoring with configurable thresholds
- Batch processing support
- Timeout protection

### **Compression Support**

- GZIP compression (.gz files)
- Deflate compression (.deflate files)
- Configurable compression levels (0-9)

### **Professional CLI**

- 25+ configuration options
- Cross-platform compatibility
- Environment variable support
- Comprehensive error handling
- Detailed logging and debugging

This feature set makes PromptShield a professional-grade tool for enterprise LLM output scanning with comprehensive safety and security detection capabilities.
