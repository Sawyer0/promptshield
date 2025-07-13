# PromptShield RulePack Authoring Guide

## What is a RulePack?

A RulePack is a YAML file that defines a set of rules for scanning prompts, responses, or other files for compliance, safety, or quality issues. RulePacks are modular, versioned, and can be enabled/disabled or filtered by severity and tags.

RulePacks live in the `rulepacks/` directory and are loaded by the Rule Engine at runtime.

**RulePack Naming Convention:**

- Use lowercase, hyphen-separated names (e.g., `pii.yaml`, `bias.yaml`, `hallucination.yaml`) for consistency in `rulepacks/`.

---

## RulePack YAML Schema & Versioning

- Every RulePack **must** include:
  - `schema_version` (required, e.g., `1.0.0`)
  - `version` (required, semantic versioning, e.g., `1.2.0`)
  - `last_updated` (required, YYYY-MM-DD)
- See [RULEPACK_SCHEMA.md](RULEPACK_SCHEMA.md) for full schema details and field descriptions.

---

## Example RulePack

```yaml
# Copyright (c) 2025 Sawyer0
# Licensed under proprietary terms. See LICENSE for details.
schema_version: 1.0.0
version: 1.2.0
last_updated: 2025-06-01
name: 'PII Detection'
description: 'Detects personally identifiable information in prompts and responses.'
rules:
  - id: 'pii-email'
    name: 'Email Address Detection'
    description: 'Detects email addresses in content.'
    severity: 'high'
    enabled: true
    type: 'regex'
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
    message: 'Email address detected: {match}'
    tags: ['pii', 'email']
```

---

## Rule Overlap and Ordering

- Rules in a RulePack are typically applied in the order they appear in the YAML file, but may be processed in parallel for performance.
- If multiple rules match the same content, all matching violations will be reported.
- There is no built-in conflict resolution; use rule `severity` and `tags` to help prioritize or filter results.
- For best results, avoid redundant or overlapping patterns within the same RulePack.

---

## How to Test and Validate RulePacks

1. Place your RulePack YAML file in the `rulepacks/` directory.
2. Run the PromptShield CLI with your target files and the `--rules-dir` option if needed.
3. Check the CLI output for detected violations and ensure rules behave as expected.
4. Use sample files in `tests/fixtures/` to verify rule coverage.
5. For advanced validation, add or update tests in `tests/rules.test.js`.

**Example Command:**

```sh
promptshield scan --input input.json --rules rulepacks/pii.yaml
```

This command scans `input.json` using the rules defined in `rulepacks/pii.yaml`.

---

## Severity Filtering

- You can filter results by severity using the CLI option, e.g.:
  ```sh
  promptshield scan --input input.json --rules rulepacks/pii.yaml --severity high
  ```
  This will only show violations with `severity: high` or above (if supported).

---

## Best Practices

- Use clear, descriptive names and messages for rules.
- Tag rules for easy filtering (e.g., `pii`, `bias`, `hallucination`).
- Set `enabled: false` for experimental or draft rules.
- Version and date every RulePack for traceability.
- Avoid overly broad regex patterns to reduce false positives.
- Group related rules in the same RulePack.

---

## Troubleshooting Common Errors

- **YAML Parse Error:** Check for indentation or formatting mistakes.
- **Missing Required Field:** Ensure all required fields are present in each rule.
- **No Violations Detected:** Test with known-bad input to confirm rule logic.
- **False Positives:** Refine patterns or add exclusions.
- **Rule Not Loaded:** Confirm the RulePack is in the correct directory and enabled.

---

## Types of RulePacks to Contribute

PromptShield thrives on a diverse ecosystem of RulePacks. Here are some high-impact types you can contribute:

- **Compliance & Legal:**
  - HIPAA (PHI detection, redaction enforcement)
  - GDPR (PII export detection, consent checks)
  - EU AI Act (high-risk use flagging)
  - Executive Orders (national security, provenance checks)
- **Security & Risk:**
  - Prompt injection (jailbreak detection)
  - LLM hallucinations
  - Sensitive API key leaks
  - Profanity, hate speech, toxicity
- **Internal Policies:**
  - Secret project leaks (project-codename.rules.yaml)
  - Employee name redaction (staff-info.rules.yaml)
  - Red team test traps (honeytoken.rules.yaml)
- **Community & Niche Packs:**
  - Finance (unapproved stock advice, SEC red flags)
  - Legal (unauthorized legal opinions)
  - OpenAI safety (mirror moderation API logic)
  - Education (block cheating, plagiarism)
  - Custom (tuned for your app or domain)

See the [RulePack Registry](RULEPACK_REGISTRY.md) for examples and inspiration.

**How to contribute:**

- Fork the repo, add your RulePack, and submit a PR.
- All contributors will be recognized in our docs and GitHub project!

---

## References

- [RULEPACK_SCHEMA.md](RULEPACK_SCHEMA.md) — RulePack schema and field details
- [RULE_ENGINE.md](RULE_ENGINE.md) — Rule engine internals
- [EXTENSIONS.md](EXTENSIONS.md) — Adding new rule types
- [ARCHITECTURE.md](ARCHITECTURE.md) — System overview
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — Contributor guide

---

For questions or to contribute new RulePacks, see the contributor guide or open an issue!
