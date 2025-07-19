/**
 * List command data transfer object
 */
export class ListCommand {
  constructor(public readonly options: ListCommandOptions) {}
}

/**
 * List command options
 */
export interface ListCommandOptions {
  rulepack?: string;
  category?: string;
  severity?: string;
  enabledOnly?: boolean;
}
