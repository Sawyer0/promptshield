# �� Extensions Guide

**Note: This guide is for future reference. The current version of PromptShield does not support plugins or custom rule types.**

PromptShield is designed to be extensible in future versions. This guide outlines the planned extension capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Planned Features](#planned-features)
- [Current Capabilities](#current-capabilities)
- [Future Roadmap](#future-roadmap)

## 🎯 Overview

PromptShield is built with extensibility in mind, though the current version focuses on core scanning functionality. Future versions will support:

- **Custom rule types** for specialized detection
- **Plugin system** for third-party integrations
- **Custom output renderers** for specific formats
- **CLI extensions** for additional commands

## 🚧 Planned Features

### Custom Rule Types

Future versions will support custom rule engines beyond regex and keyword matching:

```typescript
// Planned: Custom rule types
interface CustomRule extends Rule {
  type: 'custom';
  customLogic: (content: string) => RuleMatch[];
}
```

### Plugin System

A plugin architecture for extending functionality:

```typescript
// Planned: Plugin interface
interface PromptShieldPlugin {
  name: string;
  version: string;
  description: string;
  commands?: CustomCommand[];
  rules?: CustomRule[];
  renderers?: CustomRenderer[];
}
```

### Custom Output Renderers

Support for custom output formats:

```typescript
// Planned: Custom renderer interface
interface CustomRenderer {
  name: string;
  render(result: ScanResult): string;
}
```

## ✅ Current Capabilities

The current version of PromptShield supports:

### Rule System

- **Regex patterns** - Complex pattern matching
- **Keyword matching** - Simple phrase detection
- **Severity levels** - Critical, high, medium, low
- **Categories** - Security, PII, bias, compliance, custom

### Output Formats

- **JSON** - For automation and integration
- **Markdown** - Human-readable reports
- **CSV** - Spreadsheet analysis
- **HTML** - Web reports
- **Table** - Terminal display
- **NDJSON** - Streaming output

### Performance Features

- **Streaming processing** for large files
- **Parallel processing** with configurable workers
- **Memory management** with warnings
- **Batch processing** for efficiency

## 🗺️ Future Roadmap

### Version 1.1 (Planned)

- Custom rule type support
- Plugin system architecture
- Additional output formats

### Version 1.2 (Planned)

- Third-party plugin marketplace
- Advanced rule engines (NLP, ML)
- Custom CLI commands

### Version 1.3 (Planned)

- Enterprise plugin ecosystem
- Advanced integrations
- Custom renderer framework

## 🔧 Current Extensibility

While plugins aren't supported yet, you can extend PromptShield through:

### Custom RulePacks

```yaml
# Create custom detection rules
version: '1.0.0'
name: 'My Custom Rules'
description: 'Custom detection rules'
rules:
  - id: 'custom-pattern'
    description: 'Detects my custom pattern'
    match_regex: ['\\bmy-pattern\\b']
    severity: 'high'
    category: 'security'
    enabled: true
```

### Scripting Integration

```bash
# Use PromptShield in scripts
for file in data/*.json; do
  promptshield scan "$file" --output json --output-file "report-$(basename "$file")"
done
```

### CI/CD Integration

```yaml
# GitHub Actions integration
- name: Security Scan
  run: |
    promptshield scan data/ \
      --rulepack rulepacks/security.yaml \
      --output json \
      --output-file security-report.json \
      --fail-on critical
```

## 📚 Related Documentation

- [User Guide](USER_GUIDE.md) - Complete usage guide
- [CLI Reference](CLI_REFERENCE.md) - Command documentation
- [RulePack Guide](RULEPACK_GUIDE.md) - Create custom rules
- [Performance Guide](PERFORMANCE.md) - Optimization tips

---

**🔌 Extensibility features are planned for future versions!**

For now, focus on creating effective RulePacks and integrating PromptShield into your workflows.
