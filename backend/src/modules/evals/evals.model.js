import { z } from 'zod';

const EVAL_TYPES = ['quiz', 'midsem', 'endsem', 'assignment', 'lab', 'project', 'viva', 'other'];

export const createEvalBody = z.object({
  title: z.string().min(1).transform((v) => v.trim()),
  type: z.enum(EVAL_TYPES),
  date: z.string().refine((v) => !isNaN(new Date(v).getTime()), { message: 'date must be a valid ISO date' }),
  weightage: z.number().gt(0).max(100),
  maxScore: z.number().positive(),
  score: z.number().min(0).nullable().optional(),
}).strict();

export const updateEvalBody = z.object({
  title: z.string().min(1).transform((v) => v.trim()).optional(),
  type: z.enum(EVAL_TYPES).optional(),
  date: z.string().refine((v) => !isNaN(new Date(v).getTime()), { message: 'date must be a valid ISO date' }).optional(),
  weightage: z.number().gt(0).max(100).optional(),
  maxScore: z.number().positive().optional(),
  score: z.number().min(0).nullable().optional(),
}).strict().refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });
