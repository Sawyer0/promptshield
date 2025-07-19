/**
 * Built-in JSON schemas for PromptShield
 */

/**
 * Universal schema for AI prompt/response data
 * Handles all common use cases with a single, flexible schema
 */
export const builtinSchemas = {
  universal: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        response: { type: 'string' },
        // Allow any additional properties (metadata, timestamps, etc.)
        additionalProperties: true,
      },
      required: ['prompt', 'response'],
    },
  },
};

// Legacy aliases for backward compatibility (deprecated)
export const basic = builtinSchemas.universal;
export const extended = builtinSchemas.universal;
export const flexible = builtinSchemas.universal;
