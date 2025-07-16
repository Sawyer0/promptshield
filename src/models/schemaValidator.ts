/**
 * Schema validator singleton for PromptShield
 * Provides a shared instance with pre-loaded built-in schemas
 */

import { SchemaValidator } from './validators/schemaValidator';

/**
 * Singleton instance of SchemaValidator with built-in schemas loaded
 * Use this for most schema validation operations
 */
export const schemaValidator = new SchemaValidator();

/**
 * Re-export the class for direct instantiation if needed
 * (e.g., for testing or custom schema configurations)
 */
export { SchemaValidator } from './validators/schemaValidator';
