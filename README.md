# PromptShield 🛡️

[![npm version](https://img.shields.io/npm/v/promptshield.svg)](https://www.npmjs.com/package/promptshield)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)

> Enterprise-grade AI security scanning for LLMs. Detect prompt injections, jailbreaks, PII leaks, and compliance violations with custom RulePacks.

## 🚀 Quick Start

```bash
# Install globally
npm install -g promptshield

# Scan a file for prompt injection attacks
promptshield scan prompts.json --rulepack rulepacks/prompt-injection.yaml

# List available rules
promptshield list

# Create your own rules
promptshield init my-security-rules.yaml --template security
```

## 🎯 What is PromptShield?

PromptShield is a developer-first CLI security tool that scans AI prompts, responses, and datasets for security risks and compliance violations. It's designed to integrate seamlessly into your development workflow and CI/CD pipelines.

### Key Benefits

- **🛡️ AI Security First**: Purpose-built for detecting prompt injections, jailbreaks, and system prompt extraction attempts
- **🔧 Developer Friendly**: Zero-config setup with intuitive CLI commands
- **📦 Modular RulePacks**: Create custom rules for your specific security and compliance needs
- **🚀 High Performance**: Parallel processing and streaming for large datasets
- **🔒 Privacy Focused**: Runs completely offline - no data ever leaves your system
- **📊 Multiple Outputs**: JSON, CSV, HTML, Markdown reports for different stakeholders

### What Can It Detect?

- **Prompt Injection Attacks**: DAN jailbreaks, role-playing attacks, instruction bypass
- **System Prompt Extraction**: Attempts to reveal internal instructions or configurations
- **PII Leaks**: Emails, phone numbers, SSNs, credit cards, addresses
- **Compliance Violations**: GDPR, HIPAA, SOX, PCI-DSS requirements
- **AI Safety Issues**: Hallucinations, bias, harmful content
- **Security Vulnerabilities**: API keys, passwords, database connections

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

## 📚 Commands

| Command    | Description                        |
| ---------- | ---------------------------------- |
| `scan`     | Scan files for security violations |
| `list`     | List available rules and RulePacks |
| `init`     | Create new RulePack from templates |
| `validate` | Validate files and RulePacks       |

## 📋 RulePacks

PromptShield uses YAML-based RulePacks for detection rules:

```yaml
# Example RulePack
version: '1.0.0'
name: 'Security Rules'
rules:
  - id: 'api-key'
    description: 'Detects API keys'
    match_regex: ['\\b[A-Z0-9]{32}\\b']
    severity: 'critical'
    category: 'security'
    enabled: true
```

### Built-in RulePacks

- **prompt-injection.yaml** - AI security & jailbreaks
- **pii.yaml** - Personal information detection
- **bias.yaml** - Bias & discrimination detection

## 📊 Output Formats

- **JSON** - For automation and integration
- **Markdown** - Human-readable reports
- **CSV** - Spreadsheet analysis
- **HTML** - Web reports
- **Table** - Terminal display
- **NDJSON** - Streaming output

## 🏗️ Integration Examples

### CI/CD Pipeline

```yaml
- name: Security Scan
  run: |
    promptshield scan . \
      --rulepack rulepacks/security.yaml \
      --fail-on critical \
      --output json \
      --output-file security-report.json
```

### Node.js Integration

```javascript
const { execSync } = require('child_process');

const result = execSync(
  'promptshield scan data.json --output json --fail-on critical',
  { encoding: 'utf8' }
);
const report = JSON.parse(result);
console.log(`Found ${report.summary.total_violations} violations`);
```

## 📝 Documentation

- **[Quickstart Guide](docs/QUICKSTART.md)** - Get started in 5 minutes
- **[CLI Reference](docs/CLI_REFERENCE.md)** - Complete command documentation

## 🤝 Support

- **X/Twitter**: [@\_donnwann](https://x.com/__donnwann)

## 💡 Why PromptShield?

| Feature          | PromptShield               | Alternative Tools    |
| ---------------- | -------------------------- | -------------------- |
| **Setup Time**   | <1 minute                  | Often 30+ minutes    |
| **Offline Mode** | ✅ Always                  | ❌ Requires internet |
| **Custom Rules** | ✅ Full support            | ⚠️ Limited           |
| **Performance**  | ✅ Parallel & streaming    | ❌ Sequential only   |
| **CI/CD Ready**  | ✅ Exit codes & quiet mode | ❌ Manual parsing    |
| **Price**        | ✅ Free forever            | 💰 Paid tiers        |

## 🛡️ Security

- All file operations are sandboxed
- Input validation on all user data
- No network calls or data exfiltration
- Regular security audits

## 📜 License

**PromptShield** is proprietary software that is free to use.

- Software is UNLICENSED (see [LICENSE](LICENSE))
- Free for personal and commercial use
- No warranty provided
- Cannot modify or redistribute code

---

<p align="center">
  <strong>🚀 Start securing your AI systems today with PromptShield!</strong>
</p>

<p align="center">
  <sub>Built with ❤️ for the AI safety community</sub>
</p>
