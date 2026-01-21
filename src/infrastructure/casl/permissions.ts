import { AbilityBuilder, MongoAbility } from '@casl/ability';
import { User } from './models/user';
import { Role } from './roles';

/**
 * Tipo para as funções de permissão por role
 * Usa any para evitar dependência circular com index.ts
 */
type PermissionsByRole = (
    user: User,
    builder: AbilityBuilder<MongoAbility<any>>,
) => void;

/**
 * Definição centralizada de permissões por Role
 * 
 * Este é o coração do sistema RBAC/ABAC:
 * - can(): Define o que a role PODE fazer
 * - cannot(): Define restrições específicas
 * - Condições como { ownerId: { $eq: user.id } } implementam ABAC
 */
export const permissions: Record<Role, PermissionsByRole> = {
    /**
     * ADMIN - Acesso quase total
     * Pode gerenciar tudo, com algumas restrições de segurança
     */
    ADMIN: (user, { can, cannot }) => {
        // Permissão geral para todas as ações em todos os recursos
        can('manage', 'all');

        // Restrições de segurança:
        // Não pode transferir ownership de comunidades que não são suas
        cannot('transfer_ownership', 'Community');
        can('transfer_ownership', 'Community', {
            ownerId: { $eq: user.id },
        });
    },

    /**
     * STUDENT - Permissões limitadas
     * Foco em leitura e gerenciamento de recursos próprios
     */
    STUDENT: (user, { can }) => {
        // === Usuários ===
        // Pode ver perfis de outros usuários
        can('get', 'User');
        // Pode atualizar apenas o próprio perfil (ABAC)
        can('update', 'User', { id: { $eq: user.id } });

        // === Cursos (Somente Leitura) ===
        can('get', 'Course');

        // === Mapas Mentais ===
        // Pode criar mapas mentais
        can('create', 'MindMap');
        // Pode ver e deletar apenas os seus próprios (ABAC)
        can('get', 'MindMap', { userId: { $eq: user.id } });
        can('delete', 'MindMap', { userId: { $eq: user.id } });

        // === Comunidades ===
        // Pode criar comunidades
        can('create', 'Community');
        // Pode ver qualquer comunidade
        can('get', 'Community');
        // Pode editar/deletar apenas suas próprias comunidades (ABAC)
        can(['update', 'delete'], 'Community', {
            ownerId: { $eq: user.id },
        });

        // === Billing ===
        // Pode ver informações de billing
        can('get', 'Billing');
    },
};

