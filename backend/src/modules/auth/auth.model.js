import { z } from 'zod';

export const googleAuthBody = z.object({
  idToken: z.string().min(1),
}).strict();

export const saveClassroomTokenBody = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive().optional(),
}).strict();
