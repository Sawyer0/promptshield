# PromptShield Scan Results

## File: data/sample-prompts.json

### Scan Summary

- **Total Objects Processed:** 3
- **Violations Found:** 4
- **Scan Duration:** 245ms
- **RulePack:** rulepacks/pii.yaml

### Violations

#### High Severity

- **[high]** `email` (pii): Detects email addresses (`john.doe@example.com`) [Object 0, field: prompt]
- **[high]** `ssn` (pii): Detects US Social Security Numbers (`123-45-6789`) [Object 1, field: response]

#### Medium Severity

- **[medium]** `phone` (pii): Detects US phone numbers (`555-123-4567`) [Object 0, field: response]
- **[medium]** `address_keywords` (pii): Detects address-related keywords (`123 Main Street`) [Object 2, field: prompt]

### Severity Breakdown

- **Critical:** 0 violations
- **High:** 2 violations
- **Medium:** 2 violations
- **Low:** 0 violations

### Category Breakdown

- **PII:** 4 violations
- **Bias:** 0 violations
- **Security:** 0 violations
- **Compliance:** 0 violations

---

## File: data/clean-data.json

### Scan Summary

- **Total Objects Processed:** 2
- **Violations Found:** 0
- **Scan Duration:** 89ms
- **RulePack:** rulepacks/pii.yaml

### Status: ✅ No violations detected

This file contains clean data with no PII, bias, or other violations found.

---

## File: data/bias-examples.json

### Scan Summary

- **Total Objects Processed:** 4
- **Violations Found:** 3
- **Scan Duration:** 156ms
- **RulePack:** rulepacks/bias.yaml

### Violations

#### High Severity

- **[high]** `racial_bias` (bias): Detects racially biased language (`exotic`) [Object 1, field: prompt]
- **[high]** `ability_bias` (bias): Detects ability/disability bias (`normal people`) [Object 3, field: response]

#### Medium Severity

- **[medium]** `gender_bias` (bias): Detects gender-biased language (`bossy`) [Object 0, field: prompt]

### Severity Breakdown

- **Critical:** 0 violations
- **High:** 2 violations
- **Medium:** 1 violations
- **Low:** 0 violations

### Category Breakdown

- **PII:** 0 violations
- **Bias:** 3 violations
- **Security:** 0 violations
- **Compliance:** 0 violations

---

## Scan Summary (All Files)

- **Files Processed:** 3
- **Total Violations:** 7
- **Highest Severity:** High
- **Categories Found:** PII, Bias
- **Total Duration:** 490ms

### Recommendations

- Review high-severity PII violations for data handling compliance
- Address bias violations to ensure inclusive content
- Consider implementing automated content review workflows
