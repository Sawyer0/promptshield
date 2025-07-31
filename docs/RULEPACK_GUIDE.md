# 📦 RulePack Guide

Complete guide to creating custom RulePacks for PromptShield. Learn how to write effective detection rules for your specific security and compliance needs.

## 📋 Table of Contents

- [What are RulePacks?](#what-are-rulepacks)
- [RulePack Structure](#rulepack-structure)
- [Rule Types](#rule-types)
- [Creating Your First RulePack](#creating-your-first-rulepack)
- [Advanced Rule Patterns](#advanced-rule-patterns)
- [Best Practices](#best-practices)
- [Testing Rules](#testing-rules)
- [Templates](#templates)
- [Examples](#examples)

## 🎯 What are RulePacks?

RulePacks are YAML files that define security detection rules. Each RulePack contains:

- **Metadata**: Name, description, version, and category
- **Rules**: Individual detection patterns with severity levels
- **Configuration**: Default settings and behavior options

RulePacks allow you to:

- **Customize detection** for your specific needs
- **Organize rules** by security domain or compliance requirement
- **Share rules** across teams and projects
- **Version control** your security patterns

## 📄 RulePack Structure

### Basic RulePack Template

```yaml
version: '1.0.0'
name: 'My Custom Rules'
description: 'Organization-specific security patterns'
last_updated: '2025-01-15'
category: 'security'

rules:
  - id: 'my_first_rule'
    description: 'Detects my specific pattern'
    match_regex: ['\\bmy-pattern\\b']
    severity: 'medium'
    category: 'security'
    enabled: true
```

### Required Fields

| Field          | Type   | Description                      | Required |
| -------------- | ------ | -------------------------------- | -------- |
| `version`      | string | Semantic version (e.g., '1.0.0') | Yes      |
| `name`         | string | Human-readable name              | Yes      |
| `description`  | string | Brief description                | Yes      |
| `last_updated` | string | Date in YYYY-MM-DD format        | Yes      |
| `rules`        | array  | Array of rule objects            | Yes      |

### Optional Fields

| Field      | Type   | Description       | Default  |
| ---------- | ------ | ----------------- | -------- |
| `category` | string | RulePack category | 'custom' |
| `author`   | string | RulePack author   | -        |
| `tags`     | array  | Searchable tags   | []       |
| `metadata` | object | Custom metadata   | {}       |

## 🔍 Rule Types

### 1. Regex Rules

Use regular expressions for complex pattern matching.

```yaml
rules:
  - id: 'credit_card'
    description: 'Detects credit card numbers'
    match_regex:
      - '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b'
      - '\\b\\d{4}\\s\\d{4}\\s\\d{4}\\s\\d{4}\\b'
    severity: 'high'
    category: 'pii'
    enabled: true
```

**Best Practices:**

- Use word boundaries (`\b`) to avoid partial matches
- Escape special characters properly
- Test patterns thoroughly to avoid false positives

### 2. Keyword Rules

Use simple keyword matching for exact phrases.

```yaml
rules:
  - id: 'internal_urls'
    description: 'Detects internal URLs'
    match_keywords:
      - 'internal.company.com'
      - 'staging.company.com'
      - 'dev.company.com'
    case_sensitive: false
    severity: 'medium'
    category: 'security'
    enabled: true
```

**Options:**

- `case_sensitive`: Set to `false` for case-insensitive matching
- `whole_word`: Set to `true` to match whole words only

### 3. Combined Rules

Use both regex and keywords for comprehensive detection.

```yaml
rules:
  - id: 'ssn_with_context'
    description: 'Detects SSN with context'
    match_regex: ['\\b\\d{3}-\\d{2}-\\d{4}\\b']
    match_keywords: ['SSN', 'social security', 'social security number']
    severity: 'high'
    category: 'pii'
    enabled: true
```

### 4. Advanced Patterns

#### Negative Lookahead

```yaml
rules:
  - id: 'real_credit_card'
    description: 'Detects real credit card numbers (Luhn algorithm)'
    match_regex:
      [
        '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b',
      ]
    severity: 'high'
    category: 'pii'
    enabled: true
```

#### Context-Aware Patterns

```yaml
rules:
  - id: 'api_key_in_context'
    description: 'Detects API keys with context'
    match_regex: ['api[_-]?key[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']
    severity: 'critical'
    category: 'security'
    enabled: true
```

## 🚀 Creating Your First RulePack

### Step 1: Initialize from Template

```bash
# Create a basic template
promptshield init my-rules.yaml --template basic

# Create from security template
promptshield init security-rules.yaml --template security

# Create with custom description
promptshield init company-rules.yaml \
  --template pii \
  --description "Company-specific PII detection rules"
```

### Step 2: Edit Your Rules

Open the generated file and modify the rules:

```yaml
version: '1.0.0'
name: 'Company Security Rules'
description: 'Custom security patterns for ACME Corp'
last_updated: '2025-01-15'
category: 'security'

rules:
  - id: 'company_api_key'
    description: 'Detects ACME API keys'
    match_regex: ['\\bACME-[A-Z0-9]{32}\\b']
    severity: 'critical'
    category: 'security'
    enabled: true

  - id: 'internal_domain'
    description: 'Detects internal domain references'
    match_keywords:
      - 'internal.acme.com'
      - 'staging.acme.com'
      - 'dev.acme.com'
    case_sensitive: false
    severity: 'high'
    category: 'security'
    enabled: true

  - id: 'employee_id'
    description: 'Detects employee ID format'
    match_regex: ['\\bEMP-\\d{6}\\b']
    severity: 'medium'
    category: 'pii'
    enabled: true
```

### Step 3: Validate Your Rules

```bash
# Validate syntax
promptshield validate my-rules.yaml

# Test with known violations
promptshield test "ACME-ABC123DEF456GHI789JKL012MNO345PQ" --rulepack my-rules.yaml

# Test with normal content
promptshield test "This is normal content" --rulepack my-rules.yaml
```

### Step 4: Use Your Rules

```bash
# Scan files with your rules
promptshield scan data.json --rulepack my-rules.yaml

# Test individual strings
promptshield test "Visit internal.acme.com/admin" --rulepack my-rules.yaml
```

## 🎯 Advanced Rule Patterns

### 1. Multi-Line Patterns

```yaml
rules:
  - id: 'multi_line_pattern'
    description: 'Detects patterns across multiple lines'
    match_regex: ['(?s)username.*password.*secret']
    severity: 'high'
    category: 'security'
    enabled: true
```

### 2. Conditional Patterns

```yaml
rules:
  - id: 'conditional_api_key'
    description: 'Detects API keys only in specific contexts'
    match_regex: ['api[_-]?key[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']
    match_keywords: ['config', 'settings', 'environment']
    severity: 'critical'
    category: 'security'
    enabled: true
```

### 3. Exclusion Patterns

```yaml
rules:
  - id: 'real_email'
    description: 'Detects real email addresses (excludes test domains)'
    match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b']
    exclude_patterns: ['@test\\.com', '@example\\.com']
    severity: 'medium'
    category: 'pii'
    enabled: true
```

### 4. Performance Optimized Patterns

```yaml
rules:
  - id: 'optimized_pattern'
    description: 'Optimized pattern for performance'
    match_regex: ['\\b(?:api|key|secret|token)[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{16,}["\']?']
    severity: 'high'
    category: 'security'
    enabled: true
```

## 📊 Best Practices

### 1. Rule Design

#### ✅ Do:

- **Use descriptive IDs**: `company_api_key` instead of `rule1`
- **Write clear descriptions**: Explain what the rule detects
- **Set appropriate severity**: Match the actual risk level
- **Test thoroughly**: Check for false positives and negatives
- **Version your rules**: Use semantic versioning

#### ❌ Don't:

- **Use overly broad patterns**: Avoid catching legitimate content
- **Ignore performance**: Complex regex can slow down scanning
- **Forget to escape**: Properly escape special characters
- **Use unclear names**: Avoid generic rule IDs

### 2. Pattern Optimization

#### Performance Tips:

```yaml
# ✅ Good: Specific pattern with word boundaries
match_regex: ['\\bapi[_-]?key\\b']

# ❌ Bad: Too broad, may cause false positives
match_regex: ['api.*key']

# ✅ Good: Optimized for speed
match_regex: ['\\b\\d{3}-\\d{2}-\\d{4}\\b']

# ❌ Bad: Complex pattern that may be slow
match_regex: ['(?=.*\\d{3})(?=.*\\d{2})(?=.*\\d{4}).*']
```

#### Accuracy Tips:

```yaml
# ✅ Good: Context-aware pattern
match_regex: ['api[_-]?key[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']

# ❌ Bad: Too generic
match_regex: ['[a-zA-Z0-9]{32}']

# ✅ Good: Excludes test data
match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b']
exclude_patterns: ['@test\\.com', '@example\\.com']
```

### 3. Organization

#### Group Related Rules:

```yaml
rules:
  # API Security
  - id: 'api_key_detection'
    description: 'Detects API keys in various formats'
    match_regex: ['\\b(?:api|access)[_-]?key[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']
    severity: 'critical'
    category: 'security'
    enabled: true

  - id: 'api_secret_detection'
    description: 'Detects API secrets'
    match_regex: ['\\b(?:api|access)[_-]?secret[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']
    severity: 'critical'
    category: 'security'
    enabled: true

  # PII Detection
  - id: 'email_detection'
    description: 'Detects email addresses'
    match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b']
    severity: 'medium'
    category: 'pii'
    enabled: true
```

## 🧪 Testing Rules

### 1. Unit Testing

Create test cases for your rules:

```bash
# Test with known violations
promptshield test "ACME-ABC123DEF456GHI789JKL012MNO345PQ" --rulepack my-rules.yaml

# Test with false positive cases
promptshield test "This is normal content without violations" --rulepack my-rules.yaml

# Test specific rules
promptshield test "api_key: ABC123DEF456" --rule company_api_key --rulepack my-rules.yaml
```

### 2. Validation Testing

```bash
# Validate syntax
promptshield validate my-rules.yaml

# Validate with verbose output
promptshield validate my-rules.yaml --verbose
```

### 3. Integration Testing

```bash
# Test with real data
promptshield scan test-data.json --rulepack my-rules.yaml

# Test with different output formats
promptshield scan test-data.json --rulepack my-rules.yaml --output json
```

### 4. Performance Testing

```bash
# Test with large datasets
time promptshield scan large-data.json --rulepack my-rules.yaml

# Monitor memory usage
promptshield scan large-data.json --rulepack my-rules.yaml --memory-warning-threshold 0.7
```

## 📋 Templates

### Available Templates

| Template     | Description                       | Use Case                      |
| ------------ | --------------------------------- | ----------------------------- |
| `basic`      | Simple starter template           | Learning and experimentation  |
| `security`   | AI security and prompt injection  | Detect attacks and jailbreaks |
| `pii`        | Personal information detection    | GDPR compliance, privacy      |
| `bias`       | Bias and discrimination detection | Fair AI, content moderation   |
| `compliance` | Regulatory compliance             | HIPAA, SOX, PCI-DSS           |

### Creating Custom Templates

You can create your own templates by:

1. **Copy existing templates** and modify them
2. **Create organization-specific templates** for common patterns
3. **Share templates** across teams and projects

```bash
# Create a custom template
cp rulepacks/security.yaml templates/company-security.yaml

# Edit the template
# Add your organization's common patterns

# Use the template
promptshield init my-rules.yaml --template company-security
```

## 📚 Examples

### 1. Financial Services RulePack

```yaml
version: '1.0.0'
name: 'Financial Services Security'
description: 'Detects financial data and compliance violations'
last_updated: '2025-01-15'
category: 'compliance'

rules:
  - id: 'credit_card_numbers'
    description: 'Detects credit card numbers'
    match_regex:
      - '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b'
      - '\\b\\d{4}\\s\\d{4}\\s\\d{4}\\s\\d{4}\\b'
    severity: 'high'
    category: 'pii'
    enabled: true

  - id: 'bank_account_numbers'
    description: 'Detects bank account numbers'
    match_regex: ['\\b\\d{8,17}\\b']
    match_keywords: ['account', 'routing', 'aba']
    severity: 'high'
    category: 'pii'
    enabled: true

  - id: 'ssn_detection'
    description: 'Detects Social Security Numbers'
    match_regex: ['\\b\\d{3}-\\d{2}-\\d{4}\\b']
    severity: 'critical'
    category: 'pii'
    enabled: true
```

### 2. Healthcare RulePack

```yaml
version: '1.0.0'
name: 'Healthcare Compliance'
description: 'HIPAA compliance and medical data detection'
last_updated: '2025-01-15'
category: 'compliance'

rules:
  - id: 'patient_id'
    description: 'Detects patient identifiers'
    match_regex: ['\\bPAT-\\d{8}\\b', '\\bMRN-\\d{10}\\b']
    severity: 'high'
    category: 'pii'
    enabled: true

  - id: 'medical_terms'
    description: 'Detects medical terminology'
    match_keywords:
      - 'diagnosis'
      - 'treatment'
      - 'medication'
      - 'symptoms'
    severity: 'medium'
    category: 'compliance'
    enabled: true

  - id: 'hipaa_violations'
    description: 'Detects potential HIPAA violations'
    match_keywords:
      - 'patient name'
      - 'medical record'
      - 'treatment plan'
    severity: 'critical'
    category: 'compliance'
    enabled: true
```

### 3. AI Security RulePack

```yaml
version: '1.0.0'
name: 'AI Security Patterns'
description: 'Detects prompt injection and AI security threats'
last_updated: '2025-01-15'
category: 'security'

rules:
  - id: 'jailbreak_attempts'
    description: 'Detects jailbreak attempts'
    match_keywords:
      - 'ignore all previous instructions'
      - 'you are DAN'
      - 'roleplay as'
      - 'bypass safety'
    severity: 'critical'
    category: 'security'
    enabled: true

  - id: 'system_prompt_extraction'
    description: 'Detects system prompt extraction attempts'
    match_keywords:
      - 'what are your instructions'
      - 'show me your system prompt'
      - 'what is your training data'
    severity: 'high'
    category: 'security'
    enabled: true

  - id: 'code_execution'
    description: 'Detects code execution attempts'
    match_regex:
      - '\\b(?:exec|eval|system|shell)\\s*\\('
      - '\\b(?:import|require)\\s+["\']os["\']'
    severity: 'critical'
    category: 'security'
    enabled: true
```

## 🔧 Advanced Configuration

### Rule Options

```yaml
rules:
  - id: 'advanced_rule'
    description: 'Advanced rule with options'
    match_regex: ['\\bpattern\\b']
    match_keywords: ['keyword1', 'keyword2']
    exclude_patterns: ['exclude1', 'exclude2']
    case_sensitive: false
    whole_word: true
    severity: 'high'
    category: 'security'
    enabled: true
    metadata:
      author: 'security-team'
      tags: ['api', 'keys']
      priority: 1
```

### Conditional Rules

```yaml
rules:
  - id: 'conditional_rule'
    description: 'Rule that applies only in certain contexts'
    match_regex: ['\\bpattern\\b']
    match_keywords: ['context1', 'context2']
    severity: 'medium'
    category: 'security'
    enabled: true
    conditions:
      file_pattern: '*.config'
      field_pattern: 'config|settings'
```

---

**🎉 You're now ready to create effective RulePacks!**

For more information, see:

- [User Guide](USER_GUIDE.md) - Complete usage guide
- [CLI Reference](CLI_REFERENCE.md) - Command documentation
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Solve common issues
