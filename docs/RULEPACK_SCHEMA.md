# PromptShield RulePack Schema

Copyright (c) 2025 Sawyer0
Licensed under proprietary terms. See LICENSE for details.

## Schema Version
schema_version: 1.0.0

## Overview
This document describes the YAML schema for PromptShield RulePacks. All RulePacks must conform to this schema and include the schema_version field for compatibility and IP protection.

## Top-Level Fields
- `schema_version` (string, required): The version of the RulePack schema (e.g., "1.0.0").
- `version` (string, required): The version of this RulePack (semantic versioning, e.g., "1.2.0").
- `last_updated` (string, required): Date of last update (YYYY-MM-DD).
- `name` (string, required): Human-readable name of the RulePack.
- `description` (string, required): Brief description of the RulePack's purpose.
- `rules` (list, required): List of rule definitions (see below).

## Rule Fields
Each rule in the `rules` list must include:
- `id` (string, required): Unique identifier for the rule.
- `name` (string, required): Human-readable rule name.
- `description` (string, required): What the rule checks for.
- `severity` (string, required): One of `low`, `medium`, `high`, `critical`.
- `enabled` (bool, required): Whether the rule is active.
- `type` (string, required): Rule type (`regex`, `keyword`, `custom`, etc.).
- `pattern` or `keywords` (string or list, required): The pattern or keywords to match (depending on type).
- `message` (string, required): Message to display on violation.
- `tags` (list, required): List of tags for filtering.

## Example RulePack
```yaml
# Copyright (c) 2025 Sawyer0
# Licensed under proprietary terms. See LICENSE for details.
schema_version: 1.0.0
version: 1.2.0
last_updated: 2025-06-01
name: "PII Detection"
description: "Detects personally identifiable information (PII) in prompts, responses, and datasets."
rules:
  - id: "pii-email"
    name: "Email Address Detection"
    description: "Detects email addresses in content."
    severity: "high"
    enabled: true
    type: "regex"
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
    message: "Email address detected: {match}"
    tags: ["pii", "email"]
```

## Versioning Policy
- The `schema_version` field must be updated whenever breaking changes are made to the RulePack format.
- The `version` field in each RulePack should follow semantic versioning and be incremented for any change to the rules or metadata.
- All distributed RulePacks must include both `schema_version` and `version` for traceability and IP protection. 