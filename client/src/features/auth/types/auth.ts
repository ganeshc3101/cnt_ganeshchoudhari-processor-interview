import { z } from 'zod';

/**
 * Session represents the authenticated identity known to the client.
 *
 * It deliberately carries NO sensitive tokens. Real credentials live in
 * HttpOnly cookies set by the server and are never exposed to JavaScript.
 */
export const SessionSchema = z.object({
  authenticated: z.literal(true),
  userId: z.string().min(1),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Login form schema. Kept deliberately permissive at the form layer —
 * the server owns the real credential policy. We only enforce that
 * required fields are present so UX can short-circuit obvious mistakes.
 */
export const LoginFormSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
