/**
 * JSON parsing utilities for PromptShield
 * Handles JSON file parsing with robust error handling and validation
 */

import { schemaValidator } from '../models/schemaValidator';
import { SchemaValidationResult } from '../types/schema/schema';
import { JsonObjectArray } from '../types/data/json';

export interface JsonParseResult {
  data: JsonObjectArray;
  lineNumber?: number;
  error?: string;
  schemaValidation?: SchemaValidationResult;
}

export interface JsonParseError {
  message: string;
  lineNumber?: number;
  position?: number;
  suggestion?: string;
}

/**
 * Safely parses JSON data with comprehensive error handling
 * @param data - Raw JSON string data
 * @param filePath - Path to the file being parsed (for error messages)
 * @param schemaName - Optional schema name to validate against
 * @returns JsonParseResult with parsed data or error information
 */
export function parseJsonSafe(
  data: string,
  filePath: string,
  schemaName?: string
): JsonParseResult {
  // Handle empty files
  if (!data || data.trim().length === 0) {
    return {
      data: [],
      error: `File is empty: ${filePath}`,
    };
  }

  try {
    // Parse JSON with potential syntax error detection
    const parsed = JSON.parse(data);

    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      return {
        data: [],
        error: `Invalid JSON structure in ${filePath}: Expected an array, got ${typeof parsed}`,
      };
    }

    // Validate that array contains objects
    for (let i = 0; i < parsed.length; i++) {
      if (typeof parsed[i] !== 'object' || parsed[i] === null) {
        return {
          data: [],
          error: `Invalid JSON structure in ${filePath}: Array element at index ${i} is not an object`,
        };
      }
    }

    // Perform schema validation if schema name is provided
    let schemaValidation: SchemaValidationResult | undefined;
    if (schemaName) {
      schemaValidation = schemaValidator.validate(parsed, schemaName);
      if (!schemaValidation || !schemaValidation.isValid) {
        return {
          data: [],
          error: `Schema validation failed in ${filePath}: ${schemaValidation && schemaValidation.errors ? schemaValidation.errors.join(', ') : ''}`,
          schemaValidation,
        };
      }
    }

    return {
      data: parsed,
      schemaValidation,
    };
  } catch (error) {
    // Handle JSON syntax errors with line number detection
    const jsonError = error as SyntaxError;
    const lineNumber = detectLineNumber(data, jsonError.message);

    return {
      data: [],
      lineNumber,
      error: `Invalid JSON syntax in ${filePath}${lineNumber ? ` at line ${lineNumber}` : ''}: ${jsonError.message}`,
    };
  }
}

/**
 * Detects the line number where a JSON syntax error occurred
 * @param data - Raw JSON string data
 * @param errorMessage - The JSON.parse error message
 * @returns Line number where error occurred, or undefined if cannot be determined
 */
function detectLineNumber(
  data: string,
  errorMessage: string
): number | undefined {
  // Extract position from error message if available
  const positionMatch = errorMessage.match(/position (\d+)/);
  if (!positionMatch) {
    return undefined;
  }

  const position = parseInt(positionMatch[1], 10);
  if (isNaN(position) || position < 0) {
    return undefined;
  }

  // Count lines up to the error position
  let lineNumber = 1;
  let currentPosition = 0;

  for (const char of data) {
    if (currentPosition >= position) {
      break;
    }
    if (char === '\n') {
      lineNumber++;
    }
    currentPosition++;
  }

  return lineNumber;
}

/**
 * Validates JSON file structure and provides detailed error information
 * @param filePath - Path to the JSON file
 * @param data - Raw file content
 * @returns JsonParseError if validation fails, null if valid
 */
export function validateJsonStructure(
  filePath: string,
  data: string
): JsonParseError | null {
  const result = parseJsonSafe(data, filePath);

  if (result.error) {
    return {
      message: result.error,
      lineNumber: result.lineNumber,
      suggestion: getSuggestion(result.error),
    };
  }

  return null;
}

/**
 * Provides helpful suggestions for common JSON errors
 * @param errorMessage - The error message
 * @returns A helpful suggestion for fixing the error
 */
function getSuggestion(errorMessage: string): string {
  if (errorMessage.includes('Unexpected token')) {
    return 'Check for missing commas, brackets, or quotes in your JSON';
  }
  if (errorMessage.includes('Expected an array')) {
    return 'Your JSON file must contain an array of objects, not a single object or other data type';
  }
  if (errorMessage.includes('not an object')) {
    return 'Each element in the array must be an object (key-value pairs)';
  }
  if (errorMessage.includes('File is empty')) {
    return 'Ensure your JSON file contains valid data';
  }
  if (errorMessage.includes('Invalid JSON syntax')) {
    return 'Check for missing commas, brackets, or quotes in your JSON';
  }
  return 'Validate your JSON syntax using a JSON validator tool';
}

/**
 * Checks if a string appears to be valid JSON
 * @param data - String to check
 * @returns True if the string looks like valid JSON
 */
export function isJsonLike(data: string): boolean {
  const trimmed = data.trim();
  return (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  );
}
