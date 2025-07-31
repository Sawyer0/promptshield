/**
 * Templates for init command
 */

import { InitTemplate } from './types';

export const initTemplates: Record<string, InitTemplate> = {
  basic: {
    name: 'Basic RulePack',
    description: 'A basic template for creating custom rules',
    category: 'custom',
    rules: [
      {
        id: 'example_keyword',
        description: 'Example keyword-based rule',
        match_keywords: ['example', 'sample', 'test'],
        severity: 'low',
        category: 'custom',
        enabled: true,
      },
      {
        id: 'example_regex',
        description: 'Example regex-based rule',
        match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'],
        severity: 'medium',
        category: 'custom',
        enabled: true,
      },
    ],
  },

  security: {
    name: 'Security RulePack',
    description: 'Template for security-focused rules',
    category: 'security',
    rules: [
      {
        id: 'api_key_pattern',
        description: 'Detects potential API keys',
        match_regex: [
          '(?i)api[_-]?key[_-]?[:=]\\s*["\']?[a-zA-Z0-9]{20,}["\']?',
          '(?i)secret[_-]?key[_-]?[:=]\\s*["\']?[a-zA-Z0-9]{20,}["\']?',
        ],
        severity: 'high',
        category: 'security',
        enabled: true,
      },
      {
        id: 'password_pattern',
        description: 'Detects potential passwords',
        match_regex: [
          '(?i)password[_-]?[:=]\\s*["\']?[^\\s"\']{8,}["\']?',
          '(?i)passwd[_-]?[:=]\\s*["\']?[^\\s"\']{8,}["\']?',
        ],
        severity: 'high',
        category: 'security',
        enabled: true,
      },
    ],
  },

  pii: {
    name: 'PII Detection RulePack',
    description: 'Template for personal information detection',
    category: 'pii',
    rules: [
      {
        id: 'email_addresses',
        description: 'Detects email addresses',
        match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'],
        severity: 'medium',
        category: 'pii',
        enabled: true,
      },
      {
        id: 'phone_numbers',
        description: 'Detects phone numbers',
        match_regex: [
          '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
          '\\b\\+?1?[-.]?\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
        ],
        severity: 'medium',
        category: 'pii',
        enabled: true,
      },
      {
        id: 'social_security',
        description: 'Detects US Social Security Numbers',
        match_regex: ['\\b\\d{3}-\\d{2}-\\d{4}\\b'],
        severity: 'high',
        category: 'pii',
        enabled: true,
      },
    ],
  },

  bias: {
    name: 'Bias Detection RulePack',
    description: 'Template for bias and fairness detection',
    category: 'bias',
    rules: [
      {
        id: 'gender_bias',
        description: 'Detects potential gender bias',
        match_keywords: [
          'all men',
          'all women',
          'typical man',
          'typical woman',
          'men are',
          'women are',
          'boys will be boys',
        ],
        severity: 'medium',
        category: 'bias',
        enabled: true,
      },
      {
        id: 'age_bias',
        description: 'Detects potential age bias',
        match_keywords: [
          'too old',
          'too young',
          'old people',
          'young people',
          'millennials are',
          'boomers are',
        ],
        severity: 'medium',
        category: 'bias',
        enabled: true,
      },
      {
        id: 'stereotypes',
        description: 'Detects stereotypical language',
        match_regex: [
          '(?i)all\\s+\\w+\\s+are\\s+\\w+',
          '(?i)\\w+\\s+people\\s+are\\s+\\w+',
        ],
        severity: 'low',
        category: 'bias',
        enabled: true,
      },
    ],
  },

  compliance: {
    name: 'Compliance RulePack',
    description: 'Template for compliance and regulatory detection',
    category: 'compliance',
    rules: [
      {
        id: 'gdpr_keywords',
        description: 'Detects GDPR-related content',
        match_keywords: [
          'personal data',
          'data subject',
          'right to be forgotten',
          'data processing',
          'consent',
          'data controller',
        ],
        severity: 'medium',
        category: 'compliance',
        enabled: true,
      },
      {
        id: 'financial_terms',
        description: 'Detects financial compliance terms',
        match_keywords: [
          'material information',
          'insider trading',
          'financial disclosure',
          'material weakness',
          'audit report',
        ],
        severity: 'high',
        category: 'compliance',
        enabled: true,
      },
      {
        id: 'health_information',
        description: 'Detects health information (HIPAA)',
        match_keywords: [
          'medical record',
          'patient id',
          'diagnosis',
          'treatment plan',
          'prescription',
          'health insurance',
        ],
        severity: 'high',
        category: 'compliance',
        enabled: true,
      },
    ],
  },
};

export function getAvailableTemplates(): string[] {
  return Object.keys(initTemplates);
}

export function getTemplate(name: string): InitTemplate | undefined {
  return initTemplates[name];
}
