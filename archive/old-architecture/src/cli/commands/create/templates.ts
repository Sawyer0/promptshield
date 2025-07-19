/**
 * Templates module for create command
 * Provides RulePack templates for different use cases.
 */

interface TemplateContext {
  name: string;
  description: string;
  category: string;
}

export function getTemplate(
  templateName: string,
  context: TemplateContext
): string {
  switch (templateName) {
    case 'basic':
      return getBasicTemplate(context);
    case 'pii':
      return getPiiTemplate(context);
    case 'bias':
      return getBiasTemplate(context);
    case 'security':
      return getSecurityTemplate(context);
    case 'compliance':
      return getComplianceTemplate(context);
    default:
      return getBasicTemplate(context);
  }
}

function getBasicTemplate(context: TemplateContext): string {
  return `schema_version: 1.0.0
version: 1.0.0
last_updated: "${new Date().toISOString().split('T')[0]}"
name: "${context.name}"
description: "${context.description}"
rules:
  - id: "example-rule"
    name: "Example Rule"
    description: "An example rule to get you started"
    severity: "medium"
    enabled: true
    type: "regex"
    match_regex:
      - "example"
    message: "Example pattern found: {match}"
    tags: ["${context.category}", "example"]
`;
}

function getPiiTemplate(context: TemplateContext): string {
  return `schema_version: 1.0.0
version: 1.0.0
last_updated: "${new Date().toISOString().split('T')[0]}"
name: "${context.name}"
description: "${context.description}"
rules:
  - id: "email-detection"
    name: "Email Address Detection"
    description: "Detects email addresses in content"
    severity: "high"
    enabled: true
    type: "regex"
    match_regex:
      - "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
    message: "Email address detected: {match}"
    tags: ["pii", "email"]

  - id: "phone-detection"
    name: "Phone Number Detection"
    description: "Detects phone numbers in content"
    severity: "high"
    enabled: true
    type: "regex"
    match_regex:
      - "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b"
      - "\\b\\+?1?[-.]?\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b"
    message: "Phone number detected: {match}"
    tags: ["pii", "phone"]

  - id: "ssn-detection"
    name: "SSN Detection"
    description: "Detects Social Security Numbers"
    severity: "critical"
    enabled: true
    type: "regex"
    match_regex:
      - "\\b\\d{3}-\\d{2}-\\d{4}\\b"
    message: "SSN detected: {match}"
    tags: ["pii", "ssn"]
`;
}

function getBiasTemplate(context: TemplateContext): string {
  return `schema_version: 1.0.0
version: 1.0.0
last_updated: "${new Date().toISOString().split('T')[0]}"
name: "${context.name}"
description: "${context.description}"
rules:
  - id: "gender-bias"
    name: "Gender Bias Detection"
    description: "Detects potentially biased gender language"
    severity: "medium"
    enabled: true
    type: "keyword"
    match_keywords:
      - "he should"
      - "she should"
      - "men are"
      - "women are"
      - "male dominated"
      - "female dominated"
    message: "Potential gender bias detected: {match}"
    tags: ["bias", "gender"]

  - id: "racial-bias"
    name: "Racial Bias Detection"
    description: "Detects potentially biased racial language"
    severity: "high"
    enabled: true
    type: "keyword"
    match_keywords:
      - "all black people"
      - "all white people"
      - "all asians"
      - "stereotypical"
      - "racial stereotype"
    message: "Potential racial bias detected: {match}"
    tags: ["bias", "racial"]
`;
}

function getSecurityTemplate(context: TemplateContext): string {
  return `schema_version: 1.0.0
version: 1.0.0
last_updated: "${new Date().toISOString().split('T')[0]}"
name: "${context.name}"
description: "${context.description}"
rules:
  - id: "api-key-detection"
    name: "API Key Detection"
    description: "Detects API keys and tokens"
    severity: "critical"
    enabled: true
    type: "regex"
    match_regex:
      - "sk-[a-zA-Z0-9]{20,}"
      - "pk_[a-zA-Z0-9]{20,}"
      - "AIza[a-zA-Z0-9]{35}"
    message: "API key detected: {match}"
    tags: ["security", "api-key"]

  - id: "password-detection"
    name: "Password Detection"
    description: "Detects potential passwords"
    severity: "high"
    enabled: true
    type: "regex"
    match_regex:
      - "password[\\s]*[:=][\\s]*['\"]?[^'\"\\s]{8,}['\"]?"
      - "passwd[\\s]*[:=][\\s]*['\"]?[^'\"\\s]{8,}['\"]?"
    message: "Password detected: {match}"
    tags: ["security", "password"]
`;
}

function getComplianceTemplate(context: TemplateContext): string {
  return `schema_version: 1.0.0
version: 1.0.0
last_updated: "${new Date().toISOString().split('T')[0]}"
name: "${context.name}"
description: "${context.description}"
rules:
  - id: "hipaa-phi"
    name: "HIPAA PHI Detection"
    description: "Detects Protected Health Information"
    severity: "critical"
    enabled: true
    type: "keyword"
    match_keywords:
      - "medical record"
      - "patient id"
      - "diagnosis"
      - "treatment plan"
      - "prescription"
    message: "Potential PHI detected: {match}"
    tags: ["compliance", "hipaa"]

  - id: "gdpr-pii"
    name: "GDPR PII Detection"
    description: "Detects Personal Data under GDPR"
    severity: "high"
    enabled: true
    type: "keyword"
    match_keywords:
      - "personal data"
      - "data subject"
      - "consent"
      - "right to be forgotten"
      - "data processing"
    message: "Potential GDPR personal data: {match}"
    tags: ["compliance", "gdpr"]
`;
}
