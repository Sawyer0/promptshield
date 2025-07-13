# PromptShield Rule Engine Internals

## Overview
The Rule Engine is the core component responsible for loading, validating, compiling, and executing rules against file content. It is designed for extensibility, performance, and future support of new rule types.

## Architecture
- **RulePack Loader:** Loads and validates YAML rulepacks from the `rulepacks/` directory.
- **Rule Validator:** Ensures each rule conforms to the schema (version, last_updated, id, type, etc.).
- **Rule Compiler:** Converts rule definitions (e.g., regex patterns) into executable form.
- **Rule Executor:** Applies rules to file content and records violations.
- **Extensibility:** Supports new rule types (e.g., NLP, keyword, custom plugins) via strategy pattern.

## Data Flow
1. **Load RulePacks:** Parse YAML files and validate schema.
2. **Compile Rules:** Prepare rules for efficient execution.
3. **Apply Rules:** Run rules against file content.
4. **Detect Violations:** Record any matches or issues.
5. **Aggregate Results:** Collect violations for reporting.

## Supported Rule Types
- **Regex Rules:** Pattern-based matching.  
  _Status: Implemented and supported._
- **Keyword Rules:** Simple text matching.  
  _Status: Implemented and supported._
- **Custom Rules:** User-defined logic via plugins or extension points.  
  _Status: Supported via extensibility system (see EXTENSIONS.md)._
- **NLP Rules:** AI-powered content analysis (e.g., LLM-based, sentiment, etc.).  
  _Status: Planned for future releases._

## RulePack Schema Example
```yaml
version: "1.0"
last_updated: "2024-01-01"
name: "PII Detection"
description: "Detects personally identifiable information"
rules:
  - id: "pii-email"
    name: "Email Address Detection"
    description: "Detects email addresses in content"
    severity: "high"
    enabled: true
    type: "regex"
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
    message: "Email address detected: {match}"
    tags: ["pii", "email"]
```

## Rule Execution Flow
1. **Rule Loading:** Parse YAML files and validate schema.
2. **Rule Compilation:** Convert patterns to executable form.
3. **Content Processing:** Apply rules to file content.
4. **Violation Detection:** Identify and record violations.
5. **Result Aggregation:** Collect all violations per file.
6. **Reporting:** Format and present results.

## Extensibility Points
- **Strategy Pattern:** Add new rule types by implementing a new strategy.
- **Plugin System:** (Planned) Allow user-contributed rule types and logic.
- **Schema Validation:** Enforce rulepack structure for reliability.

## Best Practices
- Keep rule logic modular and testable.
- Document new rule types and provide examples.
- Validate all user input and rule definitions.

---
For more on extending the rule engine, see `EXTENSIONS.md`. 