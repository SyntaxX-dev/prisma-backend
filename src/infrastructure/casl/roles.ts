import { z } from 'zod';

/**
 * Schema Zod para validação de roles
 * Permite type-safety e validação em runtime
 */
export const roleSchema = z.enum(['ADMIN', 'STUDENT'] as const);

/**
 * Type TypeScript inferido do schema
 */
export type Role = z.infer<typeof roleSchema>;
