import { z } from 'zod';

export const RuleSchema = z.object({
  id: z.string(),
  description: z.string(),
  pattern: z.string(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const RulePackSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rules: z.array(RuleSchema),
});
