import { z } from 'zod';

export const googleAuthBody = z.object({
  idToken: z.string().min(1),
}).strict();
