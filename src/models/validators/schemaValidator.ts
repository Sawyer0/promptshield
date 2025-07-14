/**
 * Main schema validator for PromptShield
 */

import { SchemaValidationResult } from '../../types/schema/schema';
import { JsonObjectArray } from '../../types/data/json';
import { builtinSchemas } from '../schemas/builtinSchemas';
import { validateObject } from './objectValidator';
import {
  loadSchemaFromFile,
  getSchemaNameFromPath,
} from '../loaders/schemaLoader';

/**
 * Schema validator class for JSON schema validation
 */
export class SchemaValidator {
  private schemas: Map<string, Record<string, unknown>> = new Map();

  constructor() {
    // Register built-in schemas
    Object.entries(builtinSchemas).forEach(([name, schema]) => {
      this.registerSchema(name, schema);
    });
  }

  /**
   * Register a custom schema
   */
  registerSchema(name: string, schema: Record<string, unknown>): void {
    this.schemas.set(name, schema);
  }

  /**
   * Validate data against a schema
   */
  validate(data: JsonObjectArray, schemaName: string): SchemaValidationResult {
    const schema = this.schemas.get(schemaName);

    if (!schema) {
      return {
        isValid: false,
        schemaName,
        errors: [`Schema '${schemaName}' not found`],
      };
    }

    try {
      // Simple validation - in a real implementation, you'd use a proper JSON schema validator
      const errors: string[] = [];

      if (schema.type === 'array' && schema.items) {
        if (!Array.isArray(data)) {
          errors.push('Expected an array');
        } else {
          // Validate each item
          data.forEach((item, index) => {
            const itemErrors = validateObject(
              item,
              schema.items as Record<string, unknown>
            );
            itemErrors.forEach((error) => {
              errors.push(`Item ${index}: ${error}`);
            });
          });
        }
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
        errors: [
          `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Validate data against multiple schemas
   */
  validateMultiple(
    data: JsonObjectArray,
    schemaNames: string[]
  ): SchemaValidationResult {
    const allErrors: string[] = [];

    for (const schemaName of schemaNames) {
      const result = this.validate(data, schemaName);
      if (!result.isValid && result.errors) {
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      schemaName: schemaNames.join(','),
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  }

  /**
   * Get list of available schemas
   */
  getAvailableSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Load schema from file
   */
  async loadSchemaFromFile(filePath: string): Promise<void> {
    try {
      const schema = await loadSchemaFromFile(filePath);
      const schemaName = getSchemaNameFromPath(filePath);
      this.registerSchema(schemaName, schema);
    } catch (error) {
      throw new Error(
        `Failed to load schema from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
