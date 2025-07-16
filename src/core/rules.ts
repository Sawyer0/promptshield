/**
 * Rule processing and validation for PromptShield
 * Handles rule loading, validation, and application to content
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Rule, Violation, createViolation } from '../types/core/rule';
import { SeverityEnum, CategoryEnum } from '../types/core/severity';
import { RulePackSchema } from '../rulepacks/schema';
import { logger } from '../utils/logger';

/**
 * Normalizes severity to enum value
 */
function normalizeSeverity(severity?: string | SeverityEnum): SeverityEnum {
  if (!severity) return SeverityEnum.Medium;

  const normalized = severity.toLowerCase();
  switch (normalized) {
    case 'low':
      return SeverityEnum.Low;
    case 'medium':
      return SeverityEnum.Medium;
    case 'high':
      return SeverityEnum.High;
    case 'critical':
      return SeverityEnum.Critical;
    default:
      return SeverityEnum.Medium;
  }
}

/**
 * Normalizes category to enum value
 */
function normalizeCategory(category?: string | CategoryEnum): CategoryEnum {
  if (!category) return CategoryEnum.Custom;

  const normalized = category.toLowerCase();
  switch (normalized) {
    case 'pii':
      return CategoryEnum.PII;
    case 'bias':
      return CategoryEnum.Bias;
    case 'hallucination':
      return CategoryEnum.Hallucination;
    case 'security':
      return CategoryEnum.Security;
    case 'compliance':
      return CategoryEnum.Compliance;
    case 'parse':
      return CategoryEnum.Parse;
    case 'internal':
      return CategoryEnum.Internal;
    case 'custom':
      return CategoryEnum.Custom;
    default:
      return CategoryEnum.Custom;
  }
}

/**
 * Validates regex patterns in rules to catch syntax errors early
 */
function validateRegexPatterns(rules: Rule[]): void {
  for (const rule of rules) {
    if (rule.match_regex) {
      for (const pattern of rule.match_regex) {
        try {
          new RegExp(pattern);
        } catch (error) {
          throw new Error(
            `Invalid regex pattern '${pattern}' in rule ${rule.id}: ${error}`
          );
        }
      }
    }
  }
}

/**
 * Applies rules to text content and returns violations
 */
export function applyRulesToText(
  text: string,
  rules: Rule[],
  filePath: string,
  context?: { objectIndex?: number; field?: string }
): Violation[] {
  const violations: Violation[] = [];

  for (const rule of rules) {
    // Skip disabled rules
    if (rule.enabled === false) {
      continue;
    }

    const caseSensitive = rule.case_sensitive ?? false;

    // Handle regex patterns
    if (rule.match_regex) {
      for (const pattern of rule.match_regex) {
        try {
          const flags = caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(pattern, flags);
          let match: RegExpExecArray | null;

          while ((match = regex.exec(text)) !== null) {
            violations.push(
              createViolation({
                ruleId: rule.id,
                message: rule.description,
                match: match[0],
                severity: normalizeSeverity(rule.severity),
                category: normalizeCategory(rule.category),
                filePath,
                objectIndex: context?.objectIndex,
                field: context?.field,
              })
            );
          }
        } catch (error) {
          // Log warning but continue processing other rules
          logger.warn(
            `Invalid regex pattern '${pattern}' in rule ${rule.id}, skipping. Error: ${(error as Error).message}`
          );
        }
      }
    }

    // Handle keyword patterns
    if (rule.match_keywords) {
      for (const keyword of rule.match_keywords) {
        const searchText = caseSensitive ? text : text.toLowerCase();
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();

        if (searchText.includes(searchKeyword)) {
          violations.push(
            createViolation({
              ruleId: rule.id,
              message: rule.description,
              match: keyword,
              severity: normalizeSeverity(rule.severity),
              category: normalizeCategory(rule.category),
              filePath,
              objectIndex: context?.objectIndex,
              field: context?.field,
            })
          );
        }
      }
    }
  }

  return violations;
}

/**
 * Loads and validates a RulePack from a YAML file
 */
export async function loadAndValidateRulePack(
  rulePackPath: string
): Promise<Rule[]> {
  try {
    const fileContent = await fs.promises.readFile(rulePackPath, 'utf8');
    const rulePack = yaml.load(fileContent);
    const validatedRulePack = RulePackSchema.parse(rulePack);

    // Versioning warning
    const rulePackObj = rulePack as Record<string, unknown>;
    if (
      !('version' in rulePackObj) ||
      typeof rulePackObj.version !== 'string' ||
      !rulePackObj.version.match(/^\d+\.\d+\.\d+$/)
    ) {
      logger.warn(
        `RulePack ${rulePackPath} is missing a valid 'version' field. Add 'version: "1.0.0"' to the top of your RulePack. See: docs/RULEPACK_GUIDE.md`
      );
    }
    if (
      !('last_updated' in rulePackObj) ||
      typeof rulePackObj.last_updated !== 'string'
    ) {
      logger.warn(
        `RulePack ${rulePackPath} is missing a 'last_updated' field. Add 'last_updated: YYYY-MM-DD' to the top of your RulePack. See: docs/RULEPACK_GUIDE.md`
      );
    }

    // Severity validation
    const allowedSeverities = Object.values(SeverityEnum);
    for (const rule of validatedRulePack.rules) {
      if (rule.severity && !allowedSeverities.includes(rule.severity)) {
        logger.warn(
          `Rule '${rule.id}' in ${rulePackPath} has invalid severity '${rule.severity}'. Allowed values: ${allowedSeverities.join(', ')}. Defaulting to 'medium'. See: docs/RULEPACK_GUIDE.md`
        );
        rule.severity = SeverityEnum.Medium;
      }
    }

    validateRegexPatterns(validatedRulePack.rules);
    return validatedRulePack.rules;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load RulePack ${rulePackPath}: ${error.message}`
      );
    }
    throw new Error(`Failed to load RulePack ${rulePackPath}: Unknown error`);
  }
}
