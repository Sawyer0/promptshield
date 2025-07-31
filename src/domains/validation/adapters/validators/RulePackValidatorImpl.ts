import { Result, ok, err } from '../../../../shared/types/Result';
import { RulePackValidator } from '../../core/ports/Validator';
import {
  ValidationResult,
  ValidationResultBuilder,
} from '../../core/entities/ValidationResult';
import { ValidationOptions } from '../../core/entities/ValidationOptions';
import { RulePack } from '../../../rules/core/entities/RulePack';
import {
  RulePackYamlData,
  RuleYamlData,
} from '../../../../shared/types/YamlData';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

/**
 * RulePack validator implementation
 */
export class RulePackValidatorImpl implements RulePackValidator {
  async validate(
    target: string,
    options: ValidationOptions
  ): Promise<Result<ValidationResult, Error>> {
    return await this.validateRulePack(target, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  supports(target: string, _options: ValidationOptions): boolean {
    const ext = path.extname(target).toLowerCase();
    return ext === '.yaml' || ext === '.yml';
  }

  async validateRulePack(
    filePath: string,
    options: ValidationOptions
  ): Promise<Result<ValidationResult, Error>> {
    const builder = new ValidationResultBuilder(filePath, 'rulepack');

    try {
      if (!fs.existsSync(filePath)) {
        builder.addError(
          'file',
          `RulePack file not found: ${filePath}`,
          'FILE_NOT_FOUND'
        );
        return ok(builder.build());
      }

      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch {
        builder.addError(
          'file',
          `RulePack file is not readable: ${filePath}`,
          'FILE_NOT_READABLE'
        );
        return ok(builder.build());
      }

      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf-8');

      const yamlResult = await this.validateYamlSyntax(content);
      if (yamlResult.isErr()) {
        builder.addError('yaml', yamlResult.error.message, 'YAML_SYNTAX_ERROR');
        return ok(builder.build());
      }

      let rulePackData: RulePackYamlData;
      try {
        rulePackData = yaml.load(content) as RulePackYamlData;
      } catch (error) {
        builder.addError('yaml', `Invalid YAML: ${error}`, 'YAML_PARSE_ERROR');
        return ok(builder.build());
      }

      if (!rulePackData || typeof rulePackData !== 'object') {
        builder.addError(
          'structure',
          'RulePack must be a valid object',
          'INVALID_STRUCTURE'
        );
        return ok(builder.build());
      }

      this.validateRequiredFields(rulePackData, builder, options);

      if (rulePackData.rules && Array.isArray(rulePackData.rules)) {
        await this.validateRulesArray(rulePackData.rules, builder, options);
      } else {
        builder.addError(
          'rules',
          'RulePack must contain a rules array',
          'MISSING_RULES'
        );
      }

      // Validate using RulePack entity (if structure is valid)
      if (builder.build().isValid) {
        try {
          RulePack.fromYaml(rulePackData);
        } catch (error) {
          builder.addError(
            'schema',
            `RulePack schema validation failed: ${error}`,
            'SCHEMA_VALIDATION_ERROR'
          );
        }
      }

      return ok(builder.build());
    } catch (error) {
      return err(new Error(`RulePack validation failed: ${error}`));
    }
  }

  async validateYamlSyntax(content: string): Promise<Result<boolean, Error>> {
    try {
      yaml.load(content);
      return ok(true);
    } catch (error) {
      return err(new Error(`YAML syntax error: ${error}`));
    }
  }

  async validateRuleSchema(
    ruleData: RuleYamlData
  ): Promise<Result<boolean, Error>> {
    try {
      // Validate individual rule structure
      if (!ruleData || typeof ruleData !== 'object') {
        return err(new Error('Rule must be a valid object'));
      }

      // Required fields
      if (!ruleData.id || typeof ruleData.id !== 'string') {
        return err(new Error('Rule must have a valid id'));
      }

      if (!ruleData.description || typeof ruleData.description !== 'string') {
        return err(new Error('Rule must have a valid description'));
      }

      // Must have either match_keywords or match_regex
      if (!ruleData.match_keywords && !ruleData.match_regex) {
        return err(
          new Error('Rule must have either match_keywords or match_regex')
        );
      }

      return ok(true);
    } catch (error) {
      return err(new Error(`Rule schema validation failed: ${error}`));
    }
  }

  async validateRegexPatterns(
    rules: RuleYamlData[]
  ): Promise<Result<ValidationResult, Error>> {
    const builder = new ValidationResultBuilder('regex-patterns', 'rulepack');

    try {
      for (const rule of rules) {
        if (rule.match_regex && Array.isArray(rule.match_regex)) {
          for (let i = 0; i < rule.match_regex.length; i++) {
            const pattern = rule.match_regex[i];
            try {
              new RegExp(pattern);
            } catch (error) {
              builder.addError(
                `rules.${rule.id}.match_regex[${i}]`,
                `Invalid regex pattern: ${pattern} - ${error}`,
                'INVALID_REGEX'
              );
            }
          }
        }
      }

      return ok(builder.build());
    } catch (error) {
      return err(new Error(`Regex validation failed: ${error}`));
    }
  }

  private validateRequiredFields(
    rulePackData: RulePackYamlData,
    builder: ValidationResultBuilder,
    options: ValidationOptions
  ): void {
    // Required fields
    if (!rulePackData.name || typeof rulePackData.name !== 'string') {
      builder.addError(
        'name',
        'RulePack must have a valid name',
        'MISSING_NAME'
      );
    }

    if (
      !rulePackData.description ||
      typeof rulePackData.description !== 'string'
    ) {
      builder.addError(
        'description',
        'RulePack must have a valid description',
        'MISSING_DESCRIPTION'
      );
    }

    if (!rulePackData.version || typeof rulePackData.version !== 'string') {
      builder.addError(
        'version',
        'RulePack must have a valid version',
        'MISSING_VERSION'
      );
    }

    // Optional fields in strict mode
    if (options.strict) {
      if (!rulePackData.last_updated) {
        builder.addWarning(
          'last_updated',
          'RulePack should have a last_updated field',
          'MISSING_LAST_UPDATED'
        );
      }

      if (!rulePackData.author) {
        builder.addWarning(
          'author',
          'RulePack should have an author field',
          'MISSING_AUTHOR'
        );
      }
    }
  }

  private async validateRulesArray(
    rules: RuleYamlData[],
    builder: ValidationResultBuilder,
    options: ValidationOptions
  ): Promise<void> {
    if (rules.length === 0) {
      builder.addWarning('rules', 'RulePack has no rules defined', 'NO_RULES');
      return;
    }

    const seenIds = new Set<string>();
    let errorCount = 0;

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const rulePrefix = `rules[${i}]`;

      // Check max errors limit
      if (errorCount >= options.maxErrors) {
        builder.addWarning(
          'validation',
          `Validation stopped after ${options.maxErrors} errors`,
          'MAX_ERRORS_REACHED'
        );
        break;
      }

      // Validate rule schema
      const schemaResult = await this.validateRuleSchema(rule);
      if (schemaResult.isErr()) {
        builder.addError(
          rulePrefix,
          schemaResult.error.message,
          'RULE_SCHEMA_ERROR'
        );
        errorCount++;
        continue;
      }

      // Check for duplicate IDs
      if (seenIds.has(rule.id)) {
        builder.addError(
          `${rulePrefix}.id`,
          `Duplicate rule ID: ${rule.id}`,
          'DUPLICATE_ID'
        );
        errorCount++;
      } else {
        seenIds.add(rule.id);
      }

      // Validate regex patterns if present
      if (rule.match_regex && options.validateRegex) {
        const regexResult = await this.validateRegexPatterns([rule]);
        if (regexResult.isOk() && !regexResult.value.isValid) {
          for (const error of regexResult.value.errors) {
            builder.addError(
              `${rulePrefix}.${error.field}`,
              error.message,
              error.code
            );
            errorCount++;
          }
        }
      }

      // Strict mode validations
      if (options.strict) {
        if (!rule.category || typeof rule.category !== 'string') {
          builder.addError(
            `${rulePrefix}.category`,
            'Rule must have a valid category in strict mode',
            'MISSING_CATEGORY'
          );
          errorCount++;
        }

        if (!rule.severity || typeof rule.severity !== 'string') {
          builder.addError(
            `${rulePrefix}.severity`,
            'Rule must have a valid severity in strict mode',
            'MISSING_SEVERITY'
          );
          errorCount++;
        }

        if (!['low', 'medium', 'high', 'critical'].includes(rule.severity)) {
          builder.addError(
            `${rulePrefix}.severity`,
            'Invalid severity level. Must be: low, medium, high, or critical',
            'INVALID_SEVERITY'
          );
          errorCount++;
        }
      }
    }
  }
}
