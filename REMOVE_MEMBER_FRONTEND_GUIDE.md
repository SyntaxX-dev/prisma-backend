# Guia Frontend - Remover Membro da Comunidade

## Endpoint

**DELETE** `/communities/members`

## Autenticação

Requer autenticação JWT. Apenas o **dono da comunidade** pode remover membros.

## Request Body

```json
{
  "communityId": "uuid-da-comunidade",
  "memberId": "uuid-do-membro-a-ser-removido"
}
```

## Response

### Sucesso (200)

```json
{
  "success": true,
  "message": "Membro removido da comunidade com sucesso"
}
```

### Erros

- **400**: O dono da comunidade não pode ser removido
- **403**: Apenas o dono da comunidade pode remover membros
- **404**: Comunidade não encontrada ou membro não encontrado

## Como verificar se o usuário é dono

Use o endpoint **GET** `/communities/:id/members` que retorna `isCurrentUserOwner`:

```json
{
  "success": true,
  "data": {
    "members": [...],
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "isCurrentUserOwner": true  // ← Use este campo!
  }
}
```

## Exemplo de Implementação React

```tsx
import { useState, useEffect } from 'react';

interface Member {
  id: string;
  name: string;
  profileImage: string | null;
  joinedAt: string;
  isOwner: boolean;
}

interface MembersResponse {
  success: boolean;
  data: {
    members: Member[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    isCurrentUserOwner: boolean; // ← Campo importante!
  };
}

function CommunityMembersList({ communityId }: { communityId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://prisma-backend-production-4c22.up.railway.app/communities/${communityId}/members`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data: MembersResponse = await response.json();
      
      if (data.success) {
        setMembers(data.data.members);
        setIsCurrentUserOwner(data.data.isCurrentUserOwner); // ← Salvar aqui
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'https://prisma-backend-production-4c22.up.railway.app/communities/members',
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            communityId,
            memberId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Membro removido com sucesso!');
        fetchMembers(); // Recarregar lista
      } else {
        alert('Erro ao remover membro: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      alert('Erro ao remover membro');
    }
  };

  if (loading) return <div>Carregando membros...</div>;

  return (
    <div className="members-list">
      <h2>Membros da Comunidade</h2>
      
      {members.map((member) => (
        <div key={member.id} className="member-item">
          <img 
            src={member.profileImage || '/default-avatar.png'} 
            alt={member.name}
            className="member-avatar"
          />
          <div className="member-info">
            <h3>{member.name}</h3>
            {member.isOwner && <span className="badge">👑 Dono</span>}
            <p>Entrou em: {new Date(member.joinedAt).toLocaleDateString()}</p>
          </div>
          
          {/* Mostrar lixeira APENAS se for o dono E o membro não for o dono */}
          {isCurrentUserOwner && !member.isOwner && (
            <button
              onClick={() => removeMember(member.id)}
              className="delete-button"
              style={{ cursor: 'pointer' }} // ← Cursor pointer
              title="Remover membro"
            >
              🗑️
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default CommunityMembersList;
```

## Estilos CSS Recomendados

```css
.member-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.member-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.delete-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  padding: 0.5rem;
  cursor: pointer; /* ← Importante! */
  transition: transform 0.2s;
  margin-left: auto;
}

.delete-button:hover {
  transform: scale(1.2);
  color: #e74c3c;
}

.delete-button:active {
  transform: scale(0.95);
}
```

## Regras de Negócio

1. ✅ **Apenas o dono** pode ver e usar o botão de remover
2. ✅ **O dono não pode remover a si mesmo** (validação no backend)
3. ✅ **Cursor pointer** deve ser aplicado no botão de remover
4. ✅ **Confirmação** antes de remover (recomendado)

## Checklist de Implementação

- [ ] Verificar `isCurrentUserOwner` na resposta da API
- [ ] Mostrar ícone de lixeira apenas se `isCurrentUserOwner === true`
- [ ] Não mostrar lixeira para o próprio dono (`member.isOwner === true`)
- [ ] Adicionar `cursor: pointer` no estilo do botão
- [ ] Implementar confirmação antes de remover
- [ ] Recarregar lista após remoção bem-sucedida
- [ ] Tratar erros adequadamente

