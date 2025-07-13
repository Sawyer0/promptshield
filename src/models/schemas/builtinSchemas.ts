/**
 * Built-in JSON schemas for PromptShield
 */

/**
 * Built-in JSON schemas for common data formats
 */
export const builtinSchemas = {
  basic: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        response: { type: 'string' },
      },
      required: ['prompt', 'response'],
    },
  },

  extended: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        response: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            source: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['prompt', 'response'],
    },
  },

  flexible: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        response: { type: 'string' },
      },
      required: ['prompt', 'response'],
      additionalProperties: true,
    },
  },
};
