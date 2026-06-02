import { z } from 'zod';

export const createCourseBody = z.object({
  name: z.string().min(1).max(100).transform((v) => v.trim()),
  credits: z.number().positive().optional().default(4),
  targetGrade: z.number().min(0).max(100).optional(),
}).strict();

export const updateCourseBody = z.object({
  name: z.string().min(1).max(100).transform((v) => v.trim()).optional(),
  credits: z.number().positive().optional().default(4),
  targetGrade: z.number().min(0).max(100).optional(),
}).strict().refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });
