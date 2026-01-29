import { z } from 'zod';

/**
 * Schema da comunidade para contexto de autorização
 * Inclui ownerId para verificação ABAC (ownership)
 */
export const communitySchema = z.object({
    __typename: z.literal('Community').default('Community'),
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
});

export type Community = z.infer<typeof communitySchema>;
