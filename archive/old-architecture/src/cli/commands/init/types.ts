/**
 * Type definitions for init command
 */

export interface InitOptions {
  template?: string;
  description?: string;
  category?: string;
  force?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

export interface InitTemplate {
  name: string;
  description: string;
  category: string;
  rules: InitRule[];
}

export interface InitRule {
  id: string;
  description: string;
  match_keywords?: string[];
  match_regex?: string[];
  severity: string;
  category: string;
  enabled: boolean;
}
