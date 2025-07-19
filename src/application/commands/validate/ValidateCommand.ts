/**
 * Validate command
 */
export class ValidateCommand {
  constructor(
    public readonly target: string,
    public readonly options: ValidateCommandOptions
  ) {}
}

export interface ValidateCommandOptions {
  strict?: boolean;
  verbose?: boolean;
  skipWarnings?: boolean;
  maxErrors?: number;
  format?: 'json' | 'ndjson' | 'yaml' | 'txt';
  batch?: boolean;
  output?: 'json' | 'table' | 'summary';
}

export class ValidateCommandBuilder {
  private target: string = '';
  private options: ValidateCommandOptions = {};

  setTarget(target: string): this {
    this.target = target;
    return this;
  }

  setOptions(options: ValidateCommandOptions): this {
    this.options = options;
    return this;
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

  format(value: ValidateCommandOptions['format']): this {
    this.options.format = value;
    return this;
  }

  batch(value: boolean = true): this {
    this.options.batch = value;
    return this;
  }

  output(value: ValidateCommandOptions['output']): this {
    this.options.output = value;
    return this;
  }

  build(): ValidateCommand {
    if (!this.target) {
      throw new Error('Target is required for validate command');
    }

    return {
      target: this.target,
      options: this.options,
    };
  }
}
