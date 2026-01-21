import { z } from 'zod';
import { communitySchema } from '../models/community';

/**
 * Subject de Community - define ações permitidas sobre comunidades
 * Inclui transfer_ownership para mudança de dono
 */
export const communitySubject = z.tuple([
    z.union([
        z.literal('manage'),
        z.literal('create'),
        z.literal('get'),
        z.literal('update'),
        z.literal('delete'),
        z.literal('transfer_ownership'),
    ]),
    z.union([z.literal('Community'), communitySchema]),
]);

export type CommunitySubject = z.infer<typeof communitySubject>;
