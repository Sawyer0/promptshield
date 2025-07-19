import { Result } from '../../../../shared/types/Result';
import { ValidationResult } from '../entities/ValidationResult';
import { ValidationOptions } from '../entities/ValidationOptions';
import {
  RuleYamlData,
  ScanConfigData,
  OutputConfigData,
} from '../../../../shared/types/YamlData';

/**
 * Core validation port
 */
export interface Validator {
  validate(
    target: string,
    options: ValidationOptions
  ): Promise<Result<ValidationResult, Error>>;
  supports(target: string, options: ValidationOptions): boolean;
}

/**
 * RulePack validation port
 */
export interface RulePackValidator extends Validator {
  validateRulePack(
    filePath: string,
    options: ValidationOptions
  ): Promise<Result<ValidationResult, Error>>;
  validateYamlSyntax(content: string): Promise<Result<boolean, Error>>;
  validateRuleSchema(ruleData: RuleYamlData): Promise<Result<boolean, Error>>;
  validateRegexPatterns(
    rules: RuleYamlData[]
  ): Promise<Result<ValidationResult, Error>>;
}

/**
 * Input file validation port
 */
export interface InputFileValidator extends Validator {
  validateFileExists(filePath: string): Promise<Result<boolean, Error>>;
  validateFileFormat(
    filePath: string,
    expectedFormat?: string
  ): Promise<Result<boolean, Error>>;
  validateJsonStructure(content: string): Promise<Result<boolean, Error>>;
  validateFileReadability(filePath: string): Promise<Result<boolean, Error>>;
}

/**
 * Configuration validation port
 */
export interface ConfigValidator extends Validator {
  validateScanConfig(
    config: ScanConfigData
  ): Promise<Result<ValidationResult, Error>>;
  validateOutputConfig(
    config: OutputConfigData
  ): Promise<Result<ValidationResult, Error>>;
}
