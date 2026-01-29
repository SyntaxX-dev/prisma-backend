import { z } from 'zod';

/**
 * Schema do mapa mental para contexto de autorização
 * Inclui userId para verificação ABAC (ownership)
 */
export const mindmapSchema = z.object({
    __typename: z.literal('MindMap').default('MindMap'),
    id: z.string().uuid(),
    userId: z.string().uuid(),
});

export type MindMap = z.infer<typeof mindmapSchema>;
