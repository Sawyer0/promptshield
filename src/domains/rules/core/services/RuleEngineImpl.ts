import { RuleEngine, RuleMatcher, MatchResult } from '../ports/RuleEngine';
import { RuleRepository } from '../ports/RuleEngine';
import { Result, ok, err } from '../../../../shared/types/Result';
import { Rule } from '../entities/Rule';
import { RulePack } from '../entities/RulePack';
import { Violation } from '../../../../shared/types/Violation';

/**
 * Default implementation of the rule engine
 */
export class DefaultRuleEngine implements RuleEngine {
  constructor(
    private repository: RuleRepository,
    private matcher: RuleMatcher
  ) {}

  /**
   * Loads a rulepack from a file or default location
   */
  async loadRulePack(path: string): Promise<Result<RulePack, Error>> {
    try {
      // Use default path if 'default' is specified
      const rulePackPath =
        path === 'default' ? this.repository.getDefaultPath() : path;

      const result = await this.repository.loadFromYaml(rulePackPath);

      if (result.isErr()) {
        return err(result.error);
      }

      // Validate the loaded rulepack
      const validationResult = this.validateRulePack(result.value);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      return ok(result.value);
    } catch (error) {
      return err(new Error(`Failed to load rulepack: ${error}`));
    }
  }

  /**
   * Validates a rulepack
   */
  validateRulePack(rulePack: RulePack): Result<void, Error> {
    try {
      // RulePack constructor already validates, but we can add extra validation here
      if (rulePack.getEnabledRules().length === 0) {
        return err(new Error('RulePack has no enabled rules'));
      }

      return ok(undefined);
    } catch (error) {
      return err(new Error(`RulePack validation failed: ${error}`));
    }
  }

  /**
   * Applies rules to content and returns violations
   */
  async applyRules(
    fields: Record<string, string>,
    rules: Rule[],
    metadata?: Record<string, unknown>
  ): Promise<Result<Violation[], Error>> {
    try {
      const violations: Violation[] = [];

      for (const rule of rules) {
        if (!rule.enabled) continue;

        // Apply rule to each field
        for (const [fieldName, fieldValue] of Object.entries(fields)) {
          if (!fieldValue) continue;

          const matches = this.matcher.match(fieldValue, rule);

          for (const match of matches) {
            if (match.matched) {
              violations.push(
                this.createViolation(rule, fieldName, match, metadata)
              );
            }
          }
        }
      }

      return ok(violations);
    } catch (error) {
      return err(new Error(`Failed to apply rules: ${error}`));
    }
  }

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
  > {
    try {
      const matches = this.matcher.match(content, rule);

      return ok({
        matches: matches.some((m) => m.matched),
        positions: matches.filter((m) => m.matched).map((m) => m.position),
      });
    } catch (error) {
      return err(new Error(`Failed to test rule: ${error}`));
    }
  }

  /**
   * Creates a violation from a match
   */
  private createViolation(
    rule: Rule,
    field: string,
    match: MatchResult,
    metadata?: Record<string, unknown>
  ): Violation {
    return {
      ruleId: rule.id,
      ruleName: rule.id, // Using ID as name for now
      ruleDescription: rule.description,
      severity: rule.severity,
      category: rule.category,
      message: `${rule.description} found in ${field}`,
      field,
      objectIndex: (metadata?.index as number) ?? 0,
      position: match.position,
      context: match.context,
      metadata: {
        pattern: match.pattern,
        confidence: 1.0,
        tags: [],
      },
    };
  }
}

/**
 * Default implementation of rule matcher
 */
export class DefaultRuleMatcher implements RuleMatcher {
  /**
   * Matches a rule against content
   */
  match(content: string, rule: Rule): MatchResult[] {
    const matches: MatchResult[] = [];

    // Match regex patterns
    if (rule.hasRegexPatterns()) {
      const regexMatches = this.matchRegexPatterns(content, rule);
      matches.push(...regexMatches);
    }

    // Match keyword patterns
    if (rule.hasKeywordPatterns()) {
      const keywordMatches = this.matchKeywordPatterns(content, rule);
      matches.push(...keywordMatches);
    }

    return matches;
  }

  /**
   * Matches regex patterns
   */
  private matchRegexPatterns(content: string, rule: Rule): MatchResult[] {
    const matches: MatchResult[] = [];
    const patterns = rule.getCompiledRegexPatterns();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        matches.push({
          matched: true,
          position: {
            start,
            end,
            line: this.getLineNumber(content, start),
            column: this.getColumnNumber(content, start),
          },
          context: this.getContext(content, start, end),
          pattern: pattern.source,
        });
      }
    }

    return matches;
  }

  /**
   * Matches keyword patterns
   */
  private matchKeywordPatterns(content: string, rule: Rule): MatchResult[] {
    const matches: MatchResult[] = [];
    const keywords = rule.getNormalizedKeywords();
    const searchContent = rule.caseSensitive ? content : content.toLowerCase();

    for (const keyword of keywords) {
      let index = 0;
      while ((index = searchContent.indexOf(keyword, index)) !== -1) {
        const start = index;
        const end = start + keyword.length;

        matches.push({
          matched: true,
          position: {
            start,
            end,
            line: this.getLineNumber(content, start),
            column: this.getColumnNumber(content, start),
          },
          context: this.getContext(content, start, end),
          pattern: keyword,
        });

        index = end;
      }
    }

    return matches;
  }

  /**
   * Gets context around a match
   */
  private getContext(
    content: string,
    start: number,
    end: number,
    contextSize: number = 50
  ): {
    before: string;
    match: string;
    after: string;
  } {
    const beforeStart = Math.max(0, start - contextSize);
    const afterEnd = Math.min(content.length, end + contextSize);

    return {
      before: content.substring(beforeStart, start),
      match: content.substring(start, end),
      after: content.substring(end, afterEnd),
    };
  }

  /**
   * Gets line number for a position
   */
  private getLineNumber(content: string, position: number): number {
    const lines = content.substring(0, position).split('\n');
    return lines.length;
  }

  /**
   * Gets column number for a position
   */
  private getColumnNumber(content: string, position: number): number {
    const lines = content.substring(0, position).split('\n');
    const lastLine = lines[lines.length - 1];
    return lastLine.length + 1;
  }
}
