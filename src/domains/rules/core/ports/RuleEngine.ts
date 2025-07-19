import { Result } from '../../../../shared/types/Result';
import { Rule } from '../entities/Rule';
import { RulePack } from '../entities/RulePack';
import { Violation } from '../../../../shared/types/Violation';

/**
 * Interface for rule engine operations
 */
export interface RuleEngine {
  /**
   * Loads a rulepack from a file or default location
   */
  loadRulePack(path: string): Promise<Result<RulePack, Error>>;

  /**
   * Validates a rulepack
   */
  validateRulePack(rulePack: RulePack): Result<void, Error>;

  /**
   * Applies rules to content and returns violations
   */
  applyRules(
    fields: Record<string, string>,
    rules: Rule[],
    metadata?: Record<string, unknown>
  ): Promise<Result<Violation[], Error>>;

  /**
   * Tests a single rule against content
   */
  testRule(
    content: string,
    rule: Rule
  ): Result<
    {
      matches: boolean;
      positions?: Array<{
        start: number;
        end: number;
        line?: number;
        column?: number;
      }>;
    },
    Error
  >;
}

/**
 * Interface for rule matching
 */
export interface RuleMatcher {
  /**
   * Matches a rule against content
   */
  match(content: string, rule: Rule): MatchResult[];
}

/**
 * Result of a rule match
 */
export interface MatchResult {
  matched: boolean;
  position: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };
  context: {
    before: string;
    match: string;
    after: string;
  };
  pattern?: string;
}

/**
 * Interface for rule repository
 */
export interface RuleRepository {
  /**
   * Loads rules from a YAML file
   */
  loadFromYaml(path: string): Promise<Result<RulePack, Error>>;

  /**
   * Saves rules to a YAML file
   */
  saveToYaml(path: string, rulePack: RulePack): Promise<Result<void, Error>>;

  /**
   * Lists available rulepacks
   */
  listAvailable(): Promise<Result<string[], Error>>;

  /**
   * Gets the default rulepack path
   */
  getDefaultPath(): string;
}
