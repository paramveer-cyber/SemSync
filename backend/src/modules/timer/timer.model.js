import { z } from 'zod';

export const startTimerBody = z.object({
  plannedMinutes: z.number().int().min(1).max(240).optional(),
  linkedTaskId: z.string().nullable().optional(),
  linkedEvalId: z.string().nullable().optional(),
  linkedEvalDueDate: z.string().nullable().optional(),
  quickTitle: z.string().nullable().optional(),
  quickCategory: z.string().nullable().optional(),
}).strict();

export const extendTimerBody = z.object({
  addMinutes: z.number().int().min(1).max(30).optional(),
}).strict();

export const endTimerBody = z.object({
  nonce: z.string().min(1),
  abort: z.boolean().optional(),
  invisibleSeconds: z.number().int().min(0).optional(),
  interactionCount: z.number().int().min(0).optional(),
}).strict();

export const abortTimerBody = z.object({
  reason: z.string().optional(),
}).strict();
