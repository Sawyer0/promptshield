/**
 * Schema validation utilities for PromptShield
 * Handles JSON schema validation and built-in schema management
 */

import { JsonSchema } from '../../types/data/json';
import { SchemaValidationResult } from '../../types/schema/schema';
import { builtinSchemas } from '../schemas/builtinSchemas';

/**
 * Schema validator for JSON data
 */
export class SchemaValidator {
  private schemas: Map<string, JsonSchema> = new Map();

  constructor() {
    // Load built-in schemas
    for (const [name, schema] of Object.entries(builtinSchemas)) {
      this.schemas.set(name, schema);
    }
  }

  /**
   * Validates data against a schema
   */
  validate(data: unknown, schemaName: string): SchemaValidationResult {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      return {
        isValid: false,
        schemaName,
        errors: [`Schema '${schemaName}' not found`],
      };
    }

    try {
      // Basic schema validation (simplified for MVP)
      const errors: string[] = [];

      if (schema.type === 'array' && !Array.isArray(data)) {
        errors.push('Expected array data');
      }

      if (
        schema.type === 'object' &&
        (typeof data !== 'object' || data === null || Array.isArray(data))
      ) {
        errors.push('Expected object data');
      }

      return {
        isValid: errors.length === 0,
        schemaName,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        schemaName,
        errors: [`Schema validation error: ${error}`],
      };
    }
  }

  /**
   * Registers a custom schema
   */
  registerSchema(name: string, schema: JsonSchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * Gets all available schema names
   */
  getAvailableSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }
}

// Export singleton instance
export const schemaValidator = new SchemaValidator();
