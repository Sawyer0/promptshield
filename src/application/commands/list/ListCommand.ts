/**
 * List command data transfer object
 */
export class ListCommand {
  constructor(public readonly options: ListCommandOptions) {}
}
export interface ListCommandOptions {
  rulepack?: string;
  category?: string;
  severity?: string;
  enabledOnly?: boolean;
}
