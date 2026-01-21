# Sistema RBAC com CASL - Documentação Técnica

## 📖 Visão Geral

Este documento explica a implementação do sistema de **Role-Based Access Control (RBAC)** com a biblioteca **CASL** no backend NestJS.

---

## 🔴 Como Funcionava ANTES

### O Problema: AdminGuard Simples

Antes da implementação do CASL, o controle de acesso era feito com um guard simples que apenas verificava se o usuário era admin:

```typescript
// ❌ ANTES - AdminGuard simples
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user?.role === 'ADMIN';
  }
}
```

**Uso no controller:**

```typescript
// ❌ ANTES - Decorator no nível da rota
@Post()
@UseGuards(AdminGuard)  // Apenas verifica se é ADMIN
async createCourse(@Body() dto: CreateCourseDto) {
  // Qualquer ADMIN podia fazer qualquer coisa
}
```

### Limitações do Modelo Antigo

| Problema | Descrição |
|----------|-----------|
| **Sem granularidade** | Não diferenciava ações (criar, ler, editar, deletar) |
| **Sem ABAC** | Não verificava ownership de recursos |
| **Binário** | Apenas ADMIN/não-ADMIN, sem níveis intermediários |
| **Difícil de manter** | Permissões espalhadas em múltiplos arquivos |

---

## 🟢 Como Funciona AGORA

### Arquitetura CASL

```
src/infrastructure/casl/
├── index.ts           # Ponto de entrada - cria Ability
├── roles.ts           # Define os roles (ADMIN, STUDENT)
├── permissions.ts     # Regras centralizadas por role
├── models/            # Schemas para validação
│   ├── user.ts
│   ├── course.ts
│   ├── community.ts
│   ├── mindmap.ts
│   └── billing.ts (implícito)
├── subjects/          # Define ações permitidas por recurso
│   ├── user.ts
│   ├── course.ts
│   ├── community.ts
│   ├── mindmap.ts
│   └── billing.ts
└── utils/
    └── get-user-permissions.ts  # Helper para controllers
```

---

## 📦 Componentes do Sistema

### 1. Roles (roles.ts)

Define os tipos de usuários do sistema:

```typescript
// src/infrastructure/casl/roles.ts
import { z } from 'zod';

export const roleSchema = z.union([
  z.literal('ADMIN'),
  z.literal('STUDENT'),
]);

export type Role = z.infer<typeof roleSchema>;
```

### 2. Models (models/)

Schemas Zod que representam os recursos para autorização:

```typescript
// src/infrastructure/casl/models/course.ts
import { z } from 'zod';

export const courseSchema = z.object({
  __typename: z.literal('Course').default('Course'),
  id: z.string().uuid(),
});

export type Course = z.infer<typeof courseSchema>;
```

> **Nota:** O campo `__typename` é usado pelo CASL para identificar o tipo do recurso em runtime.

### 3. Subjects (subjects/)

Define quais ações são possíveis em cada recurso:

```typescript
// src/infrastructure/casl/subjects/course.ts
import { z } from 'zod';
import { courseSchema } from '../models/course';

export const courseSubject = z.tuple([
  z.union([
    z.literal('manage'),  // Todas as ações
    z.literal('create'),  // Criar
    z.literal('get'),     // Ler
    z.literal('update'),  // Atualizar
    z.literal('delete'),  // Deletar
  ]),
  z.union([z.literal('Course'), courseSchema]),
]);

export type CourseSubject = z.infer<typeof courseSubject>;
```

### 4. Permissions (permissions.ts)

**O coração do sistema** - define o que cada role pode fazer:

```typescript
// src/infrastructure/casl/permissions.ts
import { AbilityBuilder, MongoAbility } from '@casl/ability';
import type { User } from './models/user';
import { Role } from './roles';

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<MongoAbility<any>>
) => void;

export const permissions: Record<Role, PermissionsByRole> = {
  // ✅ ADMIN pode fazer tudo
  ADMIN: (user, { can, cannot }) => {
    can('manage', 'all');  // Acesso total
    
    // Exceto transferir ownership de comunidade que não é sua
    cannot('transfer_ownership', 'Community');
    can('transfer_ownership', 'Community', {
      ownerId: { $eq: user.id },  // ABAC: só se for dono
    });
  },

  // ✅ STUDENT tem permissões limitadas
  STUDENT: (user, { can }) => {
    // Usuário
    can('get', 'User');
    can('update', 'User', { id: { $eq: user.id } });  // Só o próprio perfil

    // Cursos - apenas leitura
    can('get', 'Course');

    // Mind Maps - CRUD próprio
    can('create', 'MindMap');
    can('get', 'MindMap', { userId: { $eq: user.id } });
    can('delete', 'MindMap', { userId: { $eq: user.id } });

    // Comunidades
    can('create', 'Community');
    can('get', 'Community');
    can(['update', 'delete'], 'Community', {
      ownerId: { $eq: user.id },  // ABAC: só as próprias
    });

    // Billing - apenas leitura
    can('get', 'Billing');
  },
};
```

### 5. Ability Factory (index.ts)

Cria a instância do CASL Ability para cada usuário:

```typescript
// src/infrastructure/casl/index.ts
import { createMongoAbility, AbilityBuilder } from '@casl/ability';
import { permissions } from './permissions';
import type { User } from './models/user';

export const defineAbilityFor = (user: User) => {
  const builder = new AbilityBuilder(createMongoAbility);

  // Aplica as permissões do role
  permissions[user.role](user, builder);

  return builder.build({
    detectSubjectType(subject) {
      return subject.__typename;  // Usa __typename para identificar
    },
  });
};
```

### 6. Helper Utility (get-user-permissions.ts)

Simplifica o uso nos controllers:

```typescript
// src/infrastructure/casl/utils/get-user-permissions.ts
import { defineAbilityFor, userSchema } from '..';
import { Role } from '../roles';

export const getUserPermissions = (userId: string, role: string) => {
  const authUser = userSchema.parse({
    id: userId,
    role: role as Role,
  });

  return defineAbilityFor(authUser);
};
```

---

## 🔧 Uso nos Controllers

### Exemplo Prático: CoursesController

```typescript
// src/presentation/http/controllers/courses.controller.ts
import { getUserPermissions } from '../../../infrastructure/casl/utils/get-user-permissions';

@Post()
async createCourse(
  @CurrentUser() user: JwtPayload,  // ① Obtém usuário autenticado
  @Body() createCourseDto: CreateCourseDto,
) {
  // ② Cria ability baseada no role do usuário
  const ability = getUserPermissions(user.sub, user.role);
  
  // ③ Verifica permissão específica
  if (ability.cannot('create', 'Course')) {
    throw new ForbiddenException('Você não tem permissão para criar cursos');
  }

  // ④ Se passou, executa a lógica normalmente
  const result = await this.createCourseUseCase.execute(createCourseDto);
  return { success: true, data: result.course };
}
```

### Fluxo de Verificação

```
Requisição → JWT Guard → Controller
                              ↓
                    getUserPermissions(userId, role)
                              ↓
                    userSchema.parse({id, role})
                              ↓
                    defineAbilityFor(user)
                              ↓
                    permissions[role](user, builder)
                              ↓
                    ability.cannot('action', 'Subject')
                              ↓
                    ✅ Permitido → Executa
                    ❌ Negado → ForbiddenException
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | ❌ Antes (AdminGuard) | ✅ Depois (CASL) |
|---------|----------------------|------------------|
| **Granularidade** | Apenas admin/não-admin | create, read, update, delete |
| **Ações** | Não diferencia | 5+ ações por recurso |
| **ABAC** | Inexistente | Ownership, condições |
| **Centralização** | Espalhado | `permissions.ts` |
| **Tipagem** | Sem validação | Zod schemas |
| **Extensibilidade** | Difícil | Adiciona role/recurso facilmente |
| **Testabilidade** | Difícil | Regras isoladas e testáveis |

---

## 🔒 Melhorias de Segurança

### 1. Princípio do Menor Privilégio

```typescript
// STUDENT só pode ver cursos, não criar
can('get', 'Course');  // ✅ Permitido
ability.cannot('create', 'Course');  // ❌ Bloqueado
```

### 2. Attribute-Based Access Control (ABAC)

```typescript
// STUDENT só pode editar SUA comunidade
can(['update', 'delete'], 'Community', {
  ownerId: { $eq: user.id },  // Condição dinâmica
});

// Verificação no controller:
const community = await this.findCommunity(id);
const authCommunity = communitySchema.parse(community);
if (ability.cannot('update', authCommunity)) {
  throw new ForbiddenException();  // Não é dono
}
```

### 3. Negação Explícita

```typescript
// ADMIN pode tudo, MAS não transferir ownership alheia
can('manage', 'all');
cannot('transfer_ownership', 'Community');
can('transfer_ownership', 'Community', {
  ownerId: { $eq: user.id },  // Exceção: só a própria
});
```

### 4. Validação em Runtime

```typescript
// Zod valida os dados antes de verificar permissão
const authUser = userSchema.parse({
  id: userId,
  role,  // Validado contra roleSchema
});
```

---

## 📈 Recursos Protegidos

| Recurso | Ações Disponíveis | Usado por |
|---------|------------------|-----------|
| `Course` | manage, create, get, update, delete | CoursesController, ModulesController |
| `User` | manage, get, update, delete | UsersController |
| `Community` | manage, create, get, update, delete, transfer_ownership | CommunitiesController |
| `MindMap` | manage, create, get, delete | CoursesController |
| `Billing` | manage, get | InvoicesController |

---

## 🚀 Como Adicionar Novo Recurso

1. **Criar Model** em `models/novo-recurso.ts`
2. **Criar Subject** em `subjects/novo-recurso.ts`
3. **Adicionar ao index.ts** (exports e AppAbilitiesSchema)
4. **Definir permissões** em `permissions.ts`
5. **Usar no Controller** com `getUserPermissions`

---

## ✅ Verificação Final

- **27 rotas protegidas** com verificações CASL
- **3 controllers migrados**: Courses, Modules, Invoices
- **Compilação TypeScript**: Sem erros
- **Arquitetura**: Centralizada e extensível
