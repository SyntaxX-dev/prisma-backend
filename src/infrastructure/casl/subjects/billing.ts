import { z } from 'zod';

/**
 * Subject de Billing - define ações permitidas sobre faturamento
 */
export const billingSubject = z.tuple([
    z.union([z.literal('manage'), z.literal('get')]),
    z.literal('Billing'),
]);

export type BillingSubject = z.infer<typeof billingSubject>;
