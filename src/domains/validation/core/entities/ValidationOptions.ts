/**
 * Validation options entity
 */
export interface ValidationOptions {
  strict: boolean;
  verbose: boolean;
  skipWarnings: boolean;
  maxErrors: number;
  validateRegex: boolean;
  validateSchema: boolean;
  format?: 'json' | 'ndjson' | 'yaml' | 'txt';
}

export class ValidationOptionsBuilder {
  private options: Partial<ValidationOptions> = {};

  static default(): ValidationOptions {
    return {
      strict: false,
      verbose: false,
      skipWarnings: false,
      maxErrors: 100,
      validateRegex: true,
      validateSchema: true,
    };
  }

  strict(value: boolean = true): this {
    this.options.strict = value;
    return this;
  }

  verbose(value: boolean = true): this {
    this.options.verbose = value;
    return this;
  }

  skipWarnings(value: boolean = true): this {
    this.options.skipWarnings = value;
    return this;
  }

  maxErrors(value: number): this {
    this.options.maxErrors = value;
    return this;
  }

  format(value: ValidationOptions['format']): this {
    this.options.format = value;
    return this;
  }

  build(): ValidationOptions {
    return {
      ...ValidationOptionsBuilder.default(),
      ...this.options,
    };
  }
}
