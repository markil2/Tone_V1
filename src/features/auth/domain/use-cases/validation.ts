import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Enter a valid email address.' })),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters.' })
    .max(72, { error: 'Password must be 72 characters or fewer.' }), // bcrypt input limit
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
