import { z } from 'zod';
import { courseSchema } from '../models/course';

/**
 * Subject de Course - define ações permitidas sobre cursos
 */
export const courseSubject = z.tuple([
    z.union([
        z.literal('manage'),
        z.literal('create'),
        z.literal('get'),
        z.literal('update'),
        z.literal('delete'),
    ]),
    z.union([z.literal('Course'), courseSchema]),
]);

export type CourseSubject = z.infer<typeof courseSubject>;
