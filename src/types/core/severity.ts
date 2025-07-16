/**
 * Severity and Category types and enums for PromptShield
 * Use these for filtering, validation, and CLI color-coding.
 */

/**
 * Severity levels (ordered by risk)
 */
export enum SeverityEnum {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * String literal type for severity
 */
export type Severity =
  | keyof typeof SeverityEnum
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Standard categories for rule violations
 */
export enum CategoryEnum {
  PII = 'pii',
  Bias = 'bias',
  Hallucination = 'hallucination',
  Security = 'security',
  Compliance = 'compliance',
  Parse = 'parse',
  Internal = 'internal',
  Custom = 'custom',
}

/**
 * String literal type for category
 */
export type Category =
  | keyof typeof CategoryEnum
  | 'pii'
  | 'bias'
  | 'hallucination'
  | 'security'
  | 'compliance'
  | 'parse'
  | 'internal'
  | 'custom';
