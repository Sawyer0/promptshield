/**
 * Remediation suggestions for common violations
 * Provides actionable advice for fixing detected issues
 */

export interface Suggestion {
  ruleId: string;
  category: string;
  severity: string;
  suggestion: string;
  link?: string;
}

const suggestions: Record<string, Suggestion> = {
  'pii-email': {
    ruleId: 'pii-email',
    category: 'pii',
    severity: 'high',
    suggestion:
      'Remove or redact email addresses. Consider using placeholder values like "user@example.com" for testing.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/PII_GUIDE.md',
  },
  'pii-phone': {
    ruleId: 'pii-phone',
    category: 'pii',
    severity: 'high',
    suggestion:
      'Remove or redact phone numbers. Use placeholder values like "+1-555-0000" for testing.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/PII_GUIDE.md',
  },
  'pii-ssn': {
    ruleId: 'pii-ssn',
    category: 'pii',
    severity: 'critical',
    suggestion:
      'CRITICAL: Remove SSN immediately. Use placeholder "XXX-XX-XXXX" for testing.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/PII_GUIDE.md',
  },
  'api-key': {
    ruleId: 'api-key',
    category: 'security',
    severity: 'critical',
    suggestion:
      'CRITICAL: Remove API keys immediately. Use environment variables or secure vaults.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/SECURITY_GUIDE.md',
  },
  password: {
    ruleId: 'password',
    category: 'security',
    severity: 'high',
    suggestion:
      'Remove hardcoded passwords. Use environment variables or secure authentication.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/SECURITY_GUIDE.md',
  },
  'bias-gender': {
    ruleId: 'bias-gender',
    category: 'bias',
    severity: 'medium',
    suggestion:
      'Review for gender bias. Ensure diverse representation in examples and content.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/BIAS_GUIDE.md',
  },
  'bias-race': {
    ruleId: 'bias-race',
    category: 'bias',
    severity: 'medium',
    suggestion:
      'Review for racial bias. Ensure inclusive and representative content.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/BIAS_GUIDE.md',
  },
  hallucination: {
    ruleId: 'hallucination',
    category: 'hallucination',
    severity: 'medium',
    suggestion:
      'Verify factual accuracy. Add citations or fact-checking mechanisms.',
    link: 'https://github.com/promptshield/promptshield-clean/docs/HALLUCINATION_GUIDE.md',
  },
};

/**
 * Get suggestion for a specific rule
 */
export function getSuggestion(ruleId: string): Suggestion | undefined {
  return suggestions[ruleId];
}

/**
 * Get suggestions for multiple violations
 */
export function getSuggestions(
  violations: Array<{ ruleId: string; category?: string; severity?: string }>
): Suggestion[] {
  const uniqueSuggestions = new Map<string, Suggestion>();

  for (const violation of violations) {
    const suggestion = getSuggestion(violation.ruleId);
    if (suggestion) {
      uniqueSuggestions.set(violation.ruleId, suggestion);
    }
  }

  return Array.from(uniqueSuggestions.values());
}

/**
 * Format suggestions for CLI output
 */
export function formatSuggestions(suggestions: Suggestion[]): string[] {
  if (suggestions.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push('💡 Remediation Suggestions:');

  for (const suggestion of suggestions) {
    const severityEmoji =
      suggestion.severity === 'critical'
        ? '🚨'
        : suggestion.severity === 'high'
          ? '⚠️'
          : '💡';

    lines.push(
      `  ${severityEmoji} ${suggestion.ruleId}: ${suggestion.suggestion}`
    );

    if (suggestion.link) {
      lines.push(`     📖 More info: ${suggestion.link}`);
    }
  }

  return lines;
}
