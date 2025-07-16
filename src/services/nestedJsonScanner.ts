import { JsonObject, JsonValue, JsonObjectArray } from '../types/data/json';
import { NestedFieldPath, FlattenedNestedObject } from '../types/data/nested';

/**
 * Extracts all nested string values from an object with their paths, up to a maximum depth
 */
export function extractNestedStrings(
  obj: JsonObject,
  prefix: string = '',
  maxDepth: number = 4,
  currentDepth: number = 0
): NestedFieldPath[] {
  const result: NestedFieldPath[] = [];

  if (currentDepth > maxDepth) {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result.push({
        path: currentPath,
        value,
        object: obj,
        depth: currentPath.split('.').length - 1,
      });
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Recursively extract from nested objects, incrementing currentDepth
      const nestedStrings = extractNestedStrings(
        value as JsonObject,
        currentPath,
        maxDepth,
        currentDepth + 1
      );
      result.push(...nestedStrings);
    }
  }

  return result;
}

/**
 * Gets a value from a nested object using dot notation path, up to a maximum depth
 */
export function getNestedValue(
  obj: JsonObject,
  path: string,
  maxDepth: number = 4
): JsonValue | undefined {
  const keys = path.split('.');
  let current: JsonValue = obj;

  if (keys.length > maxDepth + 1) {
    return undefined;
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (
      typeof current === 'object' &&
      current !== null &&
      !Array.isArray(current)
    ) {
      current = (current as JsonObject)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Sets a value in a nested object using dot notation path
 */
export function setNestedValue(
  obj: JsonObject,
  path: string,
  value: JsonValue
): boolean {
  const keys = path.split('.');
  let current: JsonObject = obj;

  // Navigate to the parent of the target key
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    const next = current[key];
    if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
      current = next as JsonObject;
    } else {
      return false; // Can't set on non-object
    }
  }

  // Set the final value
  const finalKey = keys[keys.length - 1];
  current[finalKey] = value;
  return true;
}

/**
 * Checks if a nested path exists in an object
 */
export function hasNestedPath(obj: JsonObject, path: string): boolean {
  return getNestedValue(obj, path) !== undefined;
}

/**
 * Flattens a nested object into a single-level object with dot notation keys
 */
export function flattenObject(
  obj: JsonObject,
  prefix: string = ''
): FlattenedNestedObject {
  const result: FlattenedNestedObject = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively flatten nested objects
      const flattened = flattenObject(value as JsonObject, currentKey);
      Object.assign(result, flattened);
    } else {
      // Add primitive values directly
      result[currentKey] = value as string | number | boolean | null;
    }
  }

  return result;
}

/**
 * Expands a flattened object back into a nested structure
 */
export function expandObject(flattened: FlattenedNestedObject): JsonObject {
  const result: JsonObject = {};

  for (const [key, value] of Object.entries(flattened)) {
    const keys = key.split('.');
    let current: JsonObject = result;

    // Navigate to the parent of the target key
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k] as JsonObject;
    }

    // Set the final value
    const finalKey = keys[keys.length - 1];
    current[finalKey] = value;
  }

  return result;
}

/**
 * Validates if a path string is a valid nested field path
 */
export function isValidNestedPath(path: string): boolean {
  if (!path || path.trim() === '') return false;

  // Check for invalid characters
  const invalidChars = /[\[\]@#$%^&*()+=|\\:;"'<>?,/]/;
  if (invalidChars.test(path)) return false;

  // Check for consecutive dots
  if (path.includes('..')) return false;

  // Check for leading/trailing dots
  if (path.startsWith('.') || path.endsWith('.')) return false;

  return true;
}

/**
 * Normalizes a field path (converts to lowercase, trims whitespace)
 */
export function normalizeFieldPath(path: string): string {
  return path.toLowerCase().trim();
}

/**
 * Extracts nested strings from an array of objects with specific fields
 */
export function extractNestedStringsFromArray(
  objects: JsonObjectArray,
  fields: string[]
): NestedFieldPath[] {
  const result: NestedFieldPath[] = [];

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];

    for (const field of fields) {
      if (isValidNestedPath(field)) {
        const value = getNestedValue(obj, field);
        if (typeof value === 'string') {
          result.push({
            path: field,
            value,
            object: obj,
            depth: field.split('.').length - 1,
          });
        }
      }
    }
  }

  return result;
}
