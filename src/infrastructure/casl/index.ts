import {
    AbilityBuilder,
    CreateAbility,
    createMongoAbility,
    MongoAbility,
} from '@casl/ability';
import { z } from 'zod';

import { User } from './models/user';
import { permissions } from './permissions';
import { billingSubject } from './subjects/billing';
import { communitySubject } from './subjects/community';
import { courseSubject } from './subjects/course';
import { mindmapSubject } from './subjects/mindmap';
import { userSubject } from './subjects/user';

// Re-exportar models e roles
export * from './models/user';
export * from './models/user-auth';
export * from './models/course';
export * from './models/community';
export * from './models/mindmap';
export * from './roles';

/**
 * Schema que une todos os subjects possíveis
 * Inclui a permissão especial 'manage' + 'all'
 */
const AppAbilitiesSchema = z.union([
    userSubject,
    courseSubject,
    communitySubject,
    mindmapSubject,
    billingSubject,
    z.tuple([z.literal('manage'), z.literal('all')]),
]);

type AppAbilities = z.infer<typeof AppAbilitiesSchema>;

/**
 * Tipo principal de Ability da aplicação
 */
export type AppAbility = MongoAbility<AppAbilities>;

/**
 * Factory para criar abilities
 */
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

/**
 * Função principal que cria a ability para um usuário
 * 
 * @param user - Objeto com id e role do usuário
 * @returns AppAbility com métodos can() e cannot()
 * 
 * @example
 * const ability = defineAbilityFor({ id: 'user-123', role: 'STUDENT' });
 * if (ability.can('create', 'Course')) {
 *   // Usuário pode criar curso
 * }
 */
export const defineAbilityFor = (user: User): AppAbility => {
    const builder = new AbilityBuilder(createAppAbility);

    // Verifica se a role existe no mapa de permissões
    if (typeof permissions[user.role] !== 'function') {
        throw new Error(`Role inválida: ${user.role}`);
    }

    // Aplica as permissões definidas para a role do usuário
    permissions[user.role](user, builder);

    // Constrói a ability com detector de tipo de subject
    const ability = builder.build({
        detectSubjectType(subject) {
            return subject.__typename;
        },
    });

    // Bind necessário para manter o contexto do 'this'
    ability.can = ability.can.bind(ability);
    ability.cannot = ability.cannot.bind(ability);

    return ability;
};
