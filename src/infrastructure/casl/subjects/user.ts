import { z } from 'zod';
import { userAuthSchema } from '../models/user-auth';

/**
 * Subject de User - define ações permitidas sobre usuários
 * Aceita tanto o literal 'User' quanto um objeto com id para ABAC
 */
export const userSubject = z.tuple([
    z.union([
        z.literal('manage'),
        z.literal('get'),
        z.literal('update'),
        z.literal('delete'),
    ]),
    z.union([z.literal('User'), userAuthSchema]),
]);

export type UserSubject = z.infer<typeof userSubject>;
