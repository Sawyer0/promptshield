/**
 * Types module for create command
 * Defines interfaces and types used by the create command.
 */
export interface CreateOptions {
  template?: string;
  description?: string;
  category?: string;
  force?: boolean;
}
