import { z } from 'zod';
import { SeverityEnum, CategoryEnum } from '../types/core/severity';

export const RuleSchema = z
  .object({
    id: z.string(),
    description: z.string(),
    match_regex: z.array(z.string()).optional(),
    match_keywords: z.array(z.string()).optional(),
    // Use enums for severity and category validation (source: src/types/core/severity.ts)
    severity: z.nativeEnum(SeverityEnum).optional(),
    category: z.nativeEnum(CategoryEnum).optional(),
    enabled: z.boolean().optional(),
    case_sensitive: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      // At least one matching method must be provided
      return !!(data.match_regex || data.match_keywords);
    },
    {
      message:
        'Rule must have at least one matching method: match_regex or match_keywords',
    }
  );

export const RulePackSchema = z.object({
  version: z.string().optional(),
  last_updated: z.string().optional(),
  name: z.string(),
  description: z.string(),
  rules: z.array(RuleSchema),
});

export type RulePack = z.infer<typeof RulePackSchema>;
export type Rule = z.infer<typeof RuleSchema>;
