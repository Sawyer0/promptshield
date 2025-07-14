/**
 * JSON-specific type definitions for PromptShield
 */

/**
 * Represents a JSON object with string values
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Represents any valid JSON value
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

/**
 * Represents a JSON array of objects (common format for prompt/response data)
 */
export type JsonObjectArray = JsonObject[];

/**
 * Represents a nested JSON object with dot notation paths
 */
export interface NestedJsonObject extends JsonObject {
  [key: string]: JsonValue | NestedJsonObject;
}

/**
 * Represents a field path in a nested JSON object (e.g., "user.profile.email")
 */
export type FieldPath = string;

/**
 * Represents a JSON object that can contain nested structures
 */
export interface NestedObject {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | NestedObject
    | NestedObject[];
}

/**
 * Represents a flattened object with dot notation keys
 */
export interface FlattenedObject {
  [key: string]: string | number | boolean | null;
}

/**
 * Represents a JSON schema object
 */
export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  [key: string]: unknown;
}

/**
 * Represents a JSON parsing result
 */
export interface JsonParseResult {
  data: JsonObjectArray;
  error?: string;
  lineNumber?: number;
}

/**
 * Represents a JSON parsing error
 */
export interface JsonParseError {
  message: string;
  suggestion?: string;
  lineNumber?: number;
}

/**
 * Represents a JSON object with specific fields for scanning
 */
export interface ScannableJsonObject {
  prompt?: string;
  response?: string;
  id?: string;
  [key: string]: JsonValue | undefined;
}

/**
 * Represents a JSON object that can be validated against a schema
 */
export interface ValidatableJsonObject extends JsonObject {
  [key: string]: JsonValue;
}

/**
 * Type guard to check if a value is a JSON object
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a JSON object array
 */
export function isJsonObjectArray(value: unknown): value is JsonObjectArray {
  return Array.isArray(value) && value.every((item) => isJsonObject(item));
}

/**
 * Type guard to check if a value is a nested JSON object
 */
export function isNestedJsonObject(value: unknown): value is NestedJsonObject {
  return (
    isJsonObject(value) &&
    Object.values(value).some(
      (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
    )
  );
}

/**
 * Type guard to check if a value is a scannable JSON object
 */
export function isScannableJsonObject(
  value: unknown
): value is ScannableJsonObject {
  return (
    isJsonObject(value) &&
    (typeof (value as JsonObject).prompt === 'string' ||
      typeof (value as JsonObject).response === 'string')
  );
}
