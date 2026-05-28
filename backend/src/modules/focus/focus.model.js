import { z } from 'zod';

export const endSessionBody = z.object({
  serverToken: z.string().optional(),
  plannedMinutes: z.number().int().min(0).max(240).optional(),
  actualMinutes: z.number().int().min(0).max(240),
  invisibleSeconds: z.number().int().min(0).optional(),
  interactionCount: z.number().int().min(0).optional(),
  linkedTaskId: z.string().nullable().optional(),
  linkedEvalId: z.string().nullable().optional(),
  linkedEvalDueDate: z.string().nullable().optional(),
}).strict();

export const trackPageBody = z.object({
  page: z.enum(['progress', 'settings']),
}).strict();

export const trackTaskBody = z.object({
  action: z.enum(['created', 'completed']),
}).strict();
