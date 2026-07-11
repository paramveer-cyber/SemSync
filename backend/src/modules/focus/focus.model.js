import { z } from 'zod';

export const trackPageBody = z.object({
  page: z.enum(['progress', 'settings']),
}).strict();

export const trackTaskBody = z.object({
  action: z.enum(['created', 'completed']),
}).strict();

export const startTimerBody = z.object({
  plannedMinutes: z.number().int().min(1).max(240),
  linkedTaskId: z.string().nullable().optional(),
  linkedEvalId: z.string().nullable().optional(),
  linkedEvalDueDate: z.string().nullable().optional(),
  quickTitle: z.string().min(1).max(100).nullable().optional(),
  quickCategory: z.string().min(1).max(50).nullable().optional(),
}).strict();

export const extendTimerBody = z.object({
  addMinutes: z.number().int().min(1).max(30),
}).strict();

export const endTimerBody = z.object({
  nonce: z.string().min(1),
}).strict();