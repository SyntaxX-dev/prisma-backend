import { z } from 'zod';

/**
 * Schema do usuário para verificações ABAC
 * Contém __typename para identificação em runtime
 */
export const userAuthSchema = z.object({
    __typename: z.literal('User').default('User'),
    id: z.string().uuid(),
});

export type UserAuth = z.infer<typeof userAuthSchema>;
