import { z } from 'zod';
import { mindmapSchema } from '../models/mindmap';

/**
 * Subject de MindMap - define ações permitidas sobre mapas mentais
 */
export const mindmapSubject = z.tuple([
    z.union([
        z.literal('manage'),
        z.literal('create'),
        z.literal('get'),
        z.literal('delete'),
    ]),
    z.union([z.literal('MindMap'), mindmapSchema]),
]);

export type MindMapSubject = z.infer<typeof mindmapSubject>;
