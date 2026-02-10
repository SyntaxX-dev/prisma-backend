import { AbilityBuilder, MongoAbility } from '@casl/ability';
import { User } from './models/user';
import { Role } from './roles';

type PermissionsByRole = (
    user: User,
    builder: AbilityBuilder<MongoAbility<any>>,
) => void;

export const permissions: Record<Role, PermissionsByRole> = {
  
    ADMIN: (user, { can, cannot }) => {

        can('manage', 'all');

        cannot('transfer_ownership', 'Community');
        can('transfer_ownership', 'Community', {
            ownerId: { $eq: user.id },
        });
    },

    STUDENT: (user, { can }) => {
       
        can('get', 'User');

        can('update', 'User', { id: { $eq: user.id } });

        can('get', 'Course');

        can('create', 'MindMap');

        can('get', 'MindMap', { userId: { $eq: user.id } });
        can('delete', 'MindMap', { userId: { $eq: user.id } });

        can('create', 'Community');

        can('get', 'Community');

        can(['update', 'delete'], 'Community', {
            ownerId: { $eq: user.id },
        });

        can('get', 'Billing');
    },
};

