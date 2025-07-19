/**
 * Discovery module for list command
 * Handles finding and listing available RulePacks.
 */
import { readdirSync } from 'fs';

export async function listAvailableRulePacks(): Promise<string[]> {
  const rulepackDir = 'rulepacks';
  const files = readdirSync(rulepackDir).filter(
    (f) => f.endsWith('.yaml') || f.endsWith('.yml')
  );
  return files;
}
