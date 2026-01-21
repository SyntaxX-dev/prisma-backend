import { defineAbilityFor, userSchema } from '..';
import { Role } from '../roles';

/**
 * Utility para obter as permissões de um usuário
 * 
 * @param userId - ID do usuário
 * @param role - Role do usuário (string que será validada)
 * @returns Ability com métodos can() e cannot()
 * 
 * @example
 * const ability = getUserPermissions(userId, user.role);
 * 
 * if (ability.cannot('create', 'Course')) {
 *   throw new ForbiddenException('Não autorizado');
 * }
 */
export const getUserPermissions = (userId: string, role: string) => {
    const authUser = userSchema.parse({
        id: userId,
        role: role as Role,
    });

    const ability = defineAbilityFor(authUser);

    return ability;
};
