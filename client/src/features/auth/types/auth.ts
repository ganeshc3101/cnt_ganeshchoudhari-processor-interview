import { z } from 'zod';

export const UserMeSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  status: z.string(),
  roleCodes: z.array(z.string()),
  permissionCodes: z.array(z.string()),
});

export type UserMe = z.infer<typeof UserMeSchema>;

export const AuthLoginResponseSchema = z.object({
  tokenType: z.string(),
  accessToken: z.string(),
  expiresIn: z.coerce.number(),
});

export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>;

/**
 * Authenticated session for the client — public user profile only (no tokens).
 */
export const SessionSchema = z.object({
  authenticated: z.literal(true),
  user: UserMeSchema,
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Login form — password length matches backend `AuthRequestDto` (min 12).
 */
export const LoginFormSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters.')
    .max(128, 'Password must be at most 128 characters.'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
