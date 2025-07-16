/**
 * Schema-specific type definitions for PromptShield
 */

import { JsonSchema, isJsonObject } from '../data/json';

/**
 * Represents a schema validation result
 */
export interface SchemaValidationResult {
  isValid: boolean;
  schemaName: string;
  errors?: string[];
}

/**
 * Represents a built-in schema definition
 */
export interface BuiltinSchema {
  name: string;
  schema: JsonSchema;
  description: string;
}

/**
 * Represents a custom schema that can be registered
 */
export interface CustomSchema {
  name: string;
  schema: JsonSchema;
  description?: string;
}

/**
 * Represents schema validation options
 */
export interface SchemaValidationOptions {
  strict?: boolean;
  allowAdditionalProperties?: boolean;
  validateRequired?: boolean;
}

/**
 * Represents a schema registry entry
 */
export interface SchemaRegistryEntry {
  name: string;
  schema: JsonSchema;
  description?: string;
  isBuiltin: boolean;
  createdAt: Date;
}

/**
 * Represents a schema validation error
 */
export interface SchemaValidationError {
  path: string;
  message: string;
  code: string;
  data?: unknown;
}

/**
 * Represents a schema validation context
 */
export interface SchemaValidationContext {
  schemaName: string;
  filePath?: string;
  options: SchemaValidationOptions;
}

/**
 * Represents a schema loading result
 */
export interface SchemaLoadResult {
  success: boolean;
  schema?: JsonSchema;
  error?: string;
  schemaName: string;
}

/**
 * Type guard to check if a value is a valid JSON schema
 */
export function isValidJsonSchema(value: unknown): value is JsonSchema {
  if (!isJsonObject(value)) return false;

  const schema = value as JsonSchema;
  return typeof schema.type === 'string';
}

/**
 * Type guard to check if a value is a schema validation result
 */
export function isSchemaValidationResult(
  value: unknown
): value is SchemaValidationResult {
  if (!isJsonObject(value)) return false;

  const result = value as unknown as SchemaValidationResult;
  return (
    typeof result.isValid === 'boolean' && typeof result.schemaName === 'string'
  );
}
