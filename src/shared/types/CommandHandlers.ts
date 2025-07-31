// Command handler interfaces for dependency injection

export interface CommandHandlerResult {
  isOk(): boolean;
  isErr(): boolean;
  error?: Error;
  value?: unknown;
}

export interface InitCommandHandlerService {
  execute(command: {
    filename: string;
    options: {
      template?: string;
      name?: string;
      description?: string;
      quiet?: boolean;
      verbose?: boolean;
    };
  }): Promise<CommandHandlerResult>;
}

export interface ListCommandHandlerService {
  execute(command: {
    options: {
      rulepack?: string;
      category?: string;
      severity?: string;
      enabledOnly?: boolean;
    };
  }): Promise<CommandHandlerResult>;
}
