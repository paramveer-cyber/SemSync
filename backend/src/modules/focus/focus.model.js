import { z } from 'zod';

export const endSessionBody = z.object({
  serverToken: z.string().min(1).optional(),
  plannedMinutes: z.number().int().min(1).max(240),
  actualMinutes: z.number().int().min(1).max(240),
  invisibleSeconds: z.number().int().min(0),
  interactionCount: z.number().int().min(0),
  linkedTaskId: z.string().nullable().optional(),
  linkedEvalId: z.string().nullable().optional(),
  linkedEvalDueDate: z.string().nullable().optional(),
}).strict().refine(
  ({ plannedMinutes, actualMinutes }) => actualMinutes <= plannedMinutes,
  ({ plannedMinutes }) => ({
    message: `actualMinutes cannot exceed plannedMinutes (${plannedMinutes})`,
    path: ['actualMinutes'],
  })
);

export const trackPageBody = z.object({
  page: z.enum(['progress', 'settings']),
}).strict();

export const trackTaskBody = z.object({
  action: z.enum(['created', 'completed']),
}).strict();