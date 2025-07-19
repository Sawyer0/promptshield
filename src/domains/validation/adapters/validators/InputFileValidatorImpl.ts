import { Result, ok, err } from '../../../../shared/types/Result';
import { InputFileValidator } from '../../core/ports/Validator';
import {
  ValidationResult,
  ValidationResultBuilder,
} from '../../core/entities/ValidationResult';
import { ValidationOptions } from '../../core/entities/ValidationOptions';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Input file validator implementation
 */
export class InputFileValidatorImpl implements InputFileValidator {
  async validate(
    target: string,
    options: ValidationOptions
  ): Promise<Result<ValidationResult, Error>> {
    const builder = new ValidationResultBuilder(target, 'input-file');

    try {
      // Validate file exists
      const existsResult = await this.validateFileExists(target);
      if (existsResult.isErr()) {
        builder.addError('file', existsResult.error.message, 'FILE_NOT_FOUND');
        return ok(builder.build());
      }

      // Validate file readability
      const readableResult = await this.validateFileReadability(target);
      if (readableResult.isErr()) {
        builder.addError(
          'file',
          readableResult.error.message,
          'FILE_NOT_READABLE'
        );
        return ok(builder.build());
      }

      // Validate file format
      const formatResult = await this.validateFileFormat(
        target,
        options.format
      );
      if (formatResult.isErr()) {
        builder.addError(
          'format',
          formatResult.error.message,
          'INVALID_FORMAT'
        );
        return ok(builder.build());
      }

      // Validate file content based on format
      const contentResult = await this.validateFileContent(
        target,
        options,
        builder
      );
      if (contentResult.isErr()) {
        builder.addError(
          'content',
          contentResult.error.message,
          'INVALID_CONTENT'
        );
      }

      return ok(builder.build());
    } catch (error) {
      return err(new Error(`Input file validation failed: ${error}`));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  supports(target: string, _options: ValidationOptions): boolean {
    const ext = path.extname(target).toLowerCase();
    return ['.json', '.ndjson', '.jsonl', '.txt'].includes(ext);
  }

  async validateFileExists(filePath: string): Promise<Result<boolean, Error>> {
    try {
      if (!fs.existsSync(filePath)) {
        return err(new Error(`File not found: ${filePath}`));
      }
      return ok(true);
    } catch (error) {
      return err(new Error(`Error checking file existence: ${error}`));
    }
  }

  async validateFileFormat(
    filePath: string,
    expectedFormat?: string
  ): Promise<Result<boolean, Error>> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const supportedFormats = ['.json', '.ndjson', '.jsonl', '.txt'];

      if (!supportedFormats.includes(ext)) {
        return err(
          new Error(
            `Unsupported file format: ${ext}. Supported formats: ${supportedFormats.join(', ')}`
          )
        );
      }

      // Check if expected format matches
      if (expectedFormat) {
        const expectedExt = expectedFormat.startsWith('.')
          ? expectedFormat
          : `.${expectedFormat}`;
        if (ext !== expectedExt) {
          return err(
            new Error(`Expected format ${expectedFormat} but got ${ext}`)
          );
        }
      }

      return ok(true);
    } catch (error) {
      return err(new Error(`Error validating file format: ${error}`));
    }
  }

  async validateJsonStructure(
    content: string
  ): Promise<Result<boolean, Error>> {
    try {
      JSON.parse(content);
      return ok(true);
    } catch (error) {
      return err(new Error(`Invalid JSON structure: ${error}`));
    }
  }

  async validateFileReadability(
    filePath: string
  ): Promise<Result<boolean, Error>> {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return ok(true);
    } catch {
      return err(new Error(`File is not readable: ${filePath}`));
    }
  }

  private async validateFileContent(
    filePath: string,
    options: ValidationOptions,
    builder: ValidationResultBuilder
  ): Promise<Result<boolean, Error>> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // Validate empty files
      if (content.trim().length === 0) {
        builder.addWarning('content', 'File is empty', 'EMPTY_FILE');
        return ok(true);
      }

      // Validate based on file format
      switch (ext) {
        case '.json':
          return await this.validateJsonFile(content, builder);
        case '.ndjson':
        case '.jsonl':
          return await this.validateNdjsonFile(content, builder);
        case '.txt':
          return await this.validateTextFile(content, builder);
        default:
          return ok(true);
      }
    } catch (error) {
      return err(new Error(`Error validating file content: ${error}`));
    }
  }

  private async validateJsonFile(
    content: string,
    builder: ValidationResultBuilder
  ): Promise<Result<boolean, Error>> {
    try {
      const data = JSON.parse(content);

      // Validate structure for scanning
      if (Array.isArray(data)) {
        // Array of objects
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          if (typeof item !== 'object' || item === null) {
            builder.addWarning(
              'content',
              `Item at index ${i} is not an object`,
              'INVALID_ITEM_TYPE'
            );
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        // Single object - this is fine
      } else {
        builder.addWarning(
          'content',
          'JSON should contain objects suitable for scanning',
          'INVALID_JSON_TYPE'
        );
      }

      return ok(true);
    } catch (error) {
      return err(new Error(`Invalid JSON: ${error}`));
    }
  }

  private async validateNdjsonFile(
    content: string,
    builder: ValidationResultBuilder
  ): Promise<Result<boolean, Error>> {
    try {
      const lines = content.split('\n').filter((line) => line.trim() !== '');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        try {
          const data = JSON.parse(line);
          if (typeof data !== 'object' || data === null) {
            builder.addWarning(
              'content',
              `Line ${i + 1} does not contain a valid object`,
              'INVALID_NDJSON_LINE'
            );
          }
        } catch (error) {
          builder.addError(
            'content',
            `Line ${i + 1} contains invalid JSON: ${error}`,
            'INVALID_JSON_LINE'
          );
        }
      }

      return ok(true);
    } catch (error) {
      return err(new Error(`Error validating NDJSON: ${error}`));
    }
  }

  private async validateTextFile(
    content: string,
    builder: ValidationResultBuilder
  ): Promise<Result<boolean, Error>> {
    try {
      // Check for binary content
      if (content.includes('\0')) {
        builder.addError(
          'content',
          'File appears to contain binary data',
          'BINARY_CONTENT'
        );
        return ok(false);
      }

      // Check for extremely long lines (might indicate binary or non-text data)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 10000) {
          builder.addWarning(
            'content',
            `Line ${i + 1} is extremely long (${lines[i].length} characters)`,
            'LONG_LINE'
          );
        }
      }

      return ok(true);
    } catch (error) {
      return err(new Error(`Error validating text file: ${error}`));
    }
  }
}
