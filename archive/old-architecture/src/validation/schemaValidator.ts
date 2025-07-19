/**
 * Schema validator singleton for PromptShield
 * Provides a shared instance with pre-loaded built-in schemas
 */

import { validateObject } from './objectValidator';
import { SchemaValidationResult } from '../types/schema/schema';

/**
 * Schema validator class that provides validation functionality
 */
export class SchemaValidator {
  private schemas: Map<string, Record<string, unknown>> = new Map();

  /**
   * Add a schema for validation
   * @param name - Schema name
   * @param schema - Schema definition
   */
  addSchema(name: string, schema: Record<string, unknown>): void {
    this.schemas.set(name, schema);
  }

  /**
   * Validate an object against a schema
   * @param data - Data to validate
   * @param schemaName - Name of the schema to validate against
   * @returns Schema validation result
   */
  validate(
    data: Record<string, unknown>,
    schemaName: string
  ): SchemaValidationResult {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      return {
        isValid: false,
        schemaName,
        errors: [`Schema '${schemaName}' not found`],
      };
    }

    const errors = validateObject(data, schema);
    return {
      isValid: errors.length === 0,
      schemaName,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Validate an object against a schema definition directly
   * @param data - Data to validate
   * @param schema - Schema definition
   * @returns Schema validation result
   */
  validateWithSchema(
    data: Record<string, unknown>,
    schema: Record<string, unknown>
  ): SchemaValidationResult {
    const errors = validateObject(data, schema);
    return {
      isValid: errors.length === 0,
      schemaName: 'direct',
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

/**
 * Singleton instance of SchemaValidator with built-in schemas loaded
 * Use this for most schema validation operations
 */
export const schemaValidator = new SchemaValidator();
