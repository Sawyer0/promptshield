/**
 * Object validation logic for PromptShield schema validation
 */

/**
 * Validates an object against a schema
 * @param obj - The object to validate
 * @param schema - The schema to validate against
 * @returns Array of validation errors
 */
export function validateObject(
  obj: Record<string, unknown>,
  schema: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    // Check required fields
    if (schema.required) {
      (schema.required as string[]).forEach((field: string) => {
        if (!(field in obj)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }

    // Check properties
    Object.entries(schema.properties as Record<string, unknown>).forEach(
      ([field, fieldSchema]) => {
        if (field in obj) {
          const value = obj[field];
          const fieldErrors = validateValue(
            value,
            fieldSchema as Record<string, unknown>
          );
          fieldErrors.forEach((error) => {
            errors.push(`${field}: ${error}`);
          });
        }
      }
    );

    // Check additional properties
    if (schema.additionalProperties === false) {
      Object.keys(obj).forEach((key) => {
        if (
          !schema.properties ||
          !(key in (schema.properties as Record<string, unknown>))
        ) {
          errors.push(`Unexpected field: ${key}`);
        }
      });
    }
  }

  return errors;
}

/**
 * Validates a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @returns Array of validation errors
 */
export function validateValue(
  value: unknown,
  schema: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  if (schema.type === 'string' && typeof value !== 'string') {
    errors.push('Expected string');
  } else if (schema.type === 'number' && typeof value !== 'number') {
    errors.push('Expected number');
  } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
    errors.push('Expected boolean');
  } else if (schema.type === 'array' && schema.items) {
    if (!Array.isArray(value)) {
      errors.push('Expected array');
    } else {
      value.forEach((item, index) => {
        const itemErrors = validateValue(
          item,
          schema.items as Record<string, unknown>
        );
        itemErrors.forEach((error) => {
          errors.push(`Item ${index}: ${error}`);
        });
      });
    }
  } else if (schema.type === 'object' && schema.properties) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push('Expected object');
    } else {
      const objErrors = validateObject(
        value as Record<string, unknown>,
        schema
      );
      errors.push(...objErrors);
    }
  }

  return errors;
}
