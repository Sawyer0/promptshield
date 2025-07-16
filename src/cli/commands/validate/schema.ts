/**
 * Schema validation module for validate command
 * Handles JSON schema validation against input files.
 */
import { schemaValidator } from '../../../models/schemaValidator';
import { readFileUtf8 } from '../../../services/fileUtils';
import { parseJsonSafe } from '../../../services/jsonParser';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function validateSchema(
  input: string,
  schema: string
): Promise<void> {
  try {
    const content = await readFileUtf8(input);
    const result = parseJsonSafe(content, input);

    if (result.error) {
      handleCliError(
        new Error(
          `Invalid JSON: ${result.error}. Please validate your JSON syntax using a JSON validator tool.`
        ),
        'validate'
      );
    }

    const schemaResult = schemaValidator.validate(result.data, schema);
    if (!schemaResult.isValid) {
      handleCliError(
        new Error(
          `Schema validation failed: ${schemaResult.errors?.join(', ')}. See https://github.com/promptshield/promptshield-clean#schemas`
        ),
        'validate'
      );
    }

    logger.success('Schema validation passed.');
  } catch (error) {
    handleCliError(error, 'validate');
  }
}
