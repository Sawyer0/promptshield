import { z } from 'zod';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import { Rule } from '../types/core/rule';
import { RulePackSchema } from '../rulepacks/schema';

function validateRegexPatterns(rules: Rule[]) {
  for (const rule of rules) {
    try {
      new RegExp(rule.pattern);
    } catch {
      throw new Error(`Invalid regex in rule '${rule.id}': ${rule.pattern}`);
    }
  }
}

async function loadAndValidateRulePack(filePath: string): Promise<Rule[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const rulePack = yaml.load(fileContent);
    const validatedRulePack = RulePackSchema.parse(rulePack);
    validateRegexPatterns(validatedRulePack.rules);
    return validatedRulePack.rules;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map(
          (e: z.ZodIssue) => `Field '${e.path.join('.')}' error: ${e.message}`
        )
        .join('\n');
      throw new Error(
        `Validation errors in RulePack from ${filePath}:\n${issues}`
      );
    } else if (err instanceof Error) {
      throw new Error(
        `Error loading or validating RulePack from ${filePath}: ${err.message}`
      );
    }
    throw new Error(
      `Unknown error loading or validating RulePack from ${filePath}`
    );
  }
}

export { loadAndValidateRulePack };
