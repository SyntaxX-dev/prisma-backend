import { z } from 'zod';

/**
 * Schema do curso para contexto de autorização
 * O campo __typename é usado pelo CASL para identificar o tipo de recurso
 */
export const courseSchema = z.object({
    __typename: z.literal('Course').default('Course'),
    id: z.string().uuid(),
});

export type Course = z.infer<typeof courseSchema>;
