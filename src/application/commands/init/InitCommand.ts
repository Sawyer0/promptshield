export class InitCommand {
  constructor(
    public readonly filename: string,
    public readonly options: InitCommandOptions
  ) {}
}

export interface InitCommandOptions {
  template?: string;
  description?: string;
  category?: string;
  force?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  name?: string;
}
