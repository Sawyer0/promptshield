import { OutputValidationResult } from './json';

export function validateMarkdownOutput(
  markdownOutput: string
): OutputValidationResult {
  const result: OutputValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check for required sections
  const requiredSections = [
    '# PromptShield Scan Results',
    '### Scan Summary',
    '### Violations',
  ];

  requiredSections.forEach((section) => {
    if (!markdownOutput.includes(section)) {
      result.warnings.push(`Missing section: ${section}`);
    }
  });

  // Check for severity badges
  const severityBadges = ['[high]', '[medium]', '[low]', '[critical]'];
  const foundBadges = severityBadges.filter((badge) =>
    markdownOutput.includes(badge)
  );

  if (foundBadges.length === 0) {
    result.warnings.push('No severity badges found in output');
  }

  // Check for category references
  const categoryPatterns = ['(pii)', '(bias)', '(security)', '(compliance)'];
  const foundCategories = categoryPatterns.filter((cat) =>
    markdownOutput.includes(cat)
  );

  if (foundCategories.length === 0) {
    result.warnings.push('No category references found in output');
  }

  // Check for both violation and clean scenarios
  const hasViolations =
    markdownOutput.includes('Violations Found:') &&
    /\d+/.test(markdownOutput.match(/Violations Found: (\d+)/)?.[1] || '0');

  const hasCleanScenario =
    markdownOutput.includes('No violations detected') ||
    markdownOutput.includes('Clean scan');

  if (!hasViolations && !hasCleanScenario) {
    result.warnings.push('Output does not clearly indicate violation status');
  }

  return result;
}
