// Command handler interfaces for dependency injection

/**
 * Interface for command handlers that are registered in the container
 */
export interface CommandHandlerResult {
  isOk(): boolean;
  isErr(): boolean;
  error?: Error;
  value?: unknown;
}

/**
 * Init command handler interface for container registration
 */
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

/**
 * List command handler interface for container registration
 */
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
