import { z } from 'zod';
import { roleSchema } from '../roles';

/**
 * Schema do usuário para contexto de autorização
 * Contém apenas os campos necessários para verificação de permissões
 */
export const userSchema = z.object({
    id: z.string().uuid(),
    role: roleSchema,
});

export type User = z.infer<typeof userSchema>;
