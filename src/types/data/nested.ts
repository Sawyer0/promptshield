/**
 * Nested object type definitions for PromptShield
 */

import { JsonObject, JsonValue } from './json';

/**
 * Represents a nested field path with its value and metadata
 */
export interface NestedFieldPath {
  path: string;
  value: string;
  object: JsonObject;
  depth: number;
}

/**
 * Represents a nested object traversal result
 */
export interface NestedTraversalResult {
  fields: NestedFieldPath[];
  maxDepth: number;
  totalFields: number;
}

/**
 * Represents a nested object with specific field types
 */
export interface NestedObjectWithFields {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | NestedObjectWithFields
    | NestedObjectWithFields[];
}

/**
 * Represents a flattened object with dot notation keys
 */
export interface FlattenedNestedObject {
  [key: string]: string | number | boolean | null;
}

/**
 * Represents a nested field extraction configuration
 */
export interface NestedFieldConfig {
  includeNulls?: boolean;
  includeUndefined?: boolean;
  maxDepth?: number;
  separator?: string;
}

/**
 * Represents a nested field validation result
 */
export interface NestedFieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Represents a nested object transformation result
 */
export interface NestedTransformationResult {
  original: JsonObject;
  transformed: JsonObject;
  changes: Array<{
    path: string;
    oldValue: JsonValue;
    newValue: JsonValue;
  }>;
}

/**
 * Type guard to check if a value is a nested field path
 */
export function isNestedFieldPath(value: unknown): value is NestedFieldPath {
  if (!isJsonObject(value)) return false;

  const fieldPath = value as unknown as NestedFieldPath;
  return (
    typeof fieldPath.path === 'string' &&
    typeof fieldPath.value === 'string' &&
    isJsonObject(fieldPath.object) &&
    typeof fieldPath.depth === 'number'
  );
}

/**
 * Type guard to check if a value is a nested object
 */
export function isNestedObject(
  value: unknown
): value is NestedObjectWithFields {
  if (!isJsonObject(value)) return false;

  const obj = value as NestedObjectWithFields;
  return Object.values(obj).some(
    (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
  );
}

/**
 * Type guard to check if a value is a flattened nested object
 */
export function isFlattenedNestedObject(
  value: unknown
): value is FlattenedNestedObject {
  if (!isJsonObject(value)) return false;

  const obj = value as FlattenedNestedObject;
  return Object.keys(obj).some((key) => key.includes('.'));
}

/**
 * Type guard to check if a value is a JSON object
 */
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Utility type for creating nested object types with specific field constraints
 */
export type NestedObjectWith<T extends Record<string, JsonValue>> = {
  [K in keyof T]: T[K] extends JsonObject
    ? NestedObjectWith<T[K] extends JsonObject ? T[K] : never>
    : T[K];
};

/**
 * Utility type for extracting all possible paths from a nested object type
 */
export type NestedPaths<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends Record<string, unknown>
            ? `${K}.${NestedPaths<T[K]>}`
            : K
          : never;
      }[keyof T]
    : never;
