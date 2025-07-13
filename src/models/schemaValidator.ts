/**
 * Schema validator singleton for PromptShield
 */

import { SchemaValidator } from './validators/schemaValidator';

// Create singleton instance
export const schemaValidator = new SchemaValidator();

// Re-export the class for direct instantiation if needed
export { SchemaValidator } from './validators/schemaValidator';
