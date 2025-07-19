import { RuleYamlData } from '../../../../shared/types/YamlData';

/**
 * Represents a single rule in a rulepack
 */
export class Rule {
  constructor(
    public readonly id: string,
    public readonly description: string,
    public readonly matchRegex: string[] = [],
    public readonly matchKeywords: string[] = [],
    public readonly severity: RuleSeverity = 'medium',
    public readonly category: RuleCategory = 'custom',
    public readonly enabled: boolean = true,
    public readonly caseSensitive: boolean = false
  ) {
    this.validate();
  }

  /**
   * Validates the rule configuration
   */
  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Rule ID is required');
    }

    if (!this.description || this.description.trim() === '') {
      throw new Error('Rule description is required');
    }

    if (this.matchRegex.length === 0 && this.matchKeywords.length === 0) {
      throw new Error('Rule must have either match_regex or match_keywords');
    }

    // Validate regex patterns
    this.matchRegex.forEach((pattern) => {
      try {
        new RegExp(pattern);
      } catch {
        throw new Error(`Invalid regex pattern: ${pattern}`);
      }
    });
  }

  /**
   * Checks if this rule has regex patterns
   */
  hasRegexPatterns(): boolean {
    return this.matchRegex.length > 0;
  }

  /**
   * Checks if this rule has keyword patterns
   */
  hasKeywordPatterns(): boolean {
    return this.matchKeywords.length > 0;
  }

  /**
   * Gets compiled regex patterns
   */
  getCompiledRegexPatterns(): RegExp[] {
    const flags = this.caseSensitive ? 'g' : 'gi';
    return this.matchRegex.map((pattern) => new RegExp(pattern, flags));
  }

  /**
   * Gets normalized keywords for matching
   */
  getNormalizedKeywords(): string[] {
    return this.caseSensitive
      ? this.matchKeywords
      : this.matchKeywords.map((k) => k.toLowerCase());
  }

  /**
   * Creates a rule from YAML data
   */
  static fromYaml(data: unknown): Rule {
    // Type guard to ensure data has required properties
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid rule data: must be an object');
    }

    const ruleData = data as Record<string, unknown>;

    if (typeof ruleData.id !== 'string') {
      throw new Error('Invalid rule data: id must be a string');
    }

    if (typeof ruleData.description !== 'string') {
      throw new Error('Invalid rule data: description must be a string');
    }

    return new Rule(
      ruleData.id,
      ruleData.description,
      Array.isArray(ruleData.match_regex)
        ? (ruleData.match_regex as string[])
        : [],
      Array.isArray(ruleData.match_keywords)
        ? (ruleData.match_keywords as string[])
        : [],
      (typeof ruleData.severity === 'string'
        ? ruleData.severity
        : 'medium') as RuleSeverity,
      (typeof ruleData.category === 'string'
        ? ruleData.category
        : 'custom') as RuleCategory,
      ruleData.enabled !== false,
      Boolean(ruleData.case_sensitive)
    );
  }

  /**
   * Converts rule to YAML format
   */
  toYaml(): RuleYamlData {
    return {
      id: this.id,
      description: this.description,
      ...(this.matchRegex.length > 0 && { match_regex: this.matchRegex }),
      ...(this.matchKeywords.length > 0 && {
        match_keywords: this.matchKeywords,
      }),
      severity: this.severity,
      category: this.category,
      enabled: this.enabled,
      ...(this.caseSensitive && { case_sensitive: this.caseSensitive }),
    };
  }
}

/**
 * Rule severity levels
 */
export type RuleSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Rule categories
 */
export type RuleCategory =
  | 'pii'
  | 'bias'
  | 'hallucination'
  | 'security'
  | 'compliance'
  | 'parse'
  | 'internal'
  | 'custom';
