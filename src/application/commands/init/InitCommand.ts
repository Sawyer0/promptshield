/**
 * Init command data transfer object
 */
export class InitCommand {
  constructor(
    public readonly filename: string,
    public readonly options: InitCommandOptions
  ) {}
}

/**
 * Init command options
 */
export interface InitCommandOptions {
  template?: string;
  description?: string;
  category?: string;
  force?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  name?: string;
}
