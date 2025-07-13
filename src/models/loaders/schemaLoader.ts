/**
 * Schema loading utilities for PromptShield
 */

/**
 * Loads a schema from a file
 * @param filePath - Path to the schema file
 * @returns Promise that resolves to the loaded schema
 */
export async function loadSchemaFromFile(
  filePath: string
): Promise<Record<string, unknown>> {
  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile(filePath, 'utf-8');
    const schema = JSON.parse(data) as Record<string, unknown>;
    return schema;
  } catch (error) {
    throw new Error(
      `Failed to load schema from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets the schema name from a file path
 * @param filePath - Path to the schema file
 * @returns The schema name
 */
export function getSchemaNameFromPath(filePath: string): string {
  return filePath.split('/').pop()?.replace('.json', '') || 'custom';
}
