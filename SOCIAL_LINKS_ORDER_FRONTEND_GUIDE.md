# Guia Frontend - Ordenação de Social Links

## 📋 Visão Geral

O sistema permite que usuários personalizem a ordem de exibição dos seus links sociais no perfil. A ordem é salva no banco de dados e aplicada quando o perfil é exibido.

## 🔗 Links Disponíveis

Os 5 links sociais que podem ser ordenados são:
- `linkedin`
- `github`
- `portfolio`
- `instagram`
- `twitter`

## 📡 Endpoints

### 1. Obter Perfil do Usuário (com ordem dos links)

**GET** `/user-profile/:userId`

Retorna o perfil completo do usuário, incluindo `socialLinksOrder`:

```json
{
  "id": "uuid-do-usuario",
  "name": "João Silva",
  "linkedin": "https://linkedin.com/in/joao",
  "github": "https://github.com/joao",
  "portfolio": "https://joao.dev",
  "instagram": "https://instagram.com/joao",
  "twitter": "https://twitter.com/joao",
  "socialLinksOrder": ["linkedin", "github", "portfolio", "instagram", "twitter"],
  // ... outros campos
}
```

**Ordem Padrão:**
Se o usuário nunca definiu uma ordem personalizada, o backend retorna a ordem padrão:
```json
["linkedin", "github", "portfolio", "instagram", "twitter"]
```

### 2. Atualizar Ordem dos Links

**PUT** `/user-profile/social-links-order`

**Autenticação:** Requer JWT (apenas o próprio usuário pode atualizar)

**Request Body:**
```json
{
  "socialLinksOrder": ["github", "linkedin", "portfolio", "twitter", "instagram"]
}
```

**Validações:**
- ✅ Deve conter **exatamente 5 links**
- ✅ Deve conter **todos** os links válidos: `linkedin`, `github`, `portfolio`, `instagram`, `twitter`
- ✅ Não pode conter links inválidos
- ✅ Não pode ter links duplicados

**Response (200):**
```json
{
  "success": true,
  "message": "Ordem dos links atualizada com sucesso",
  "data": {
    "socialLinksOrder": ["github", "linkedin", "portfolio", "twitter", "instagram"]
  }
}
```

**Erros (400):**
```json
{
  "statusCode": 400,
  "message": "A ordem deve conter exatamente os links: linkedin, github, portfolio, instagram, twitter",
  "error": "Bad Request"
}
```

## 💻 Implementação Frontend

### Exemplo Completo com React + TypeScript

```tsx
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface SocialLink {
  id: string;
  name: string;
  icon: string;
  url: string | null;
}

interface UserProfile {
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  instagram: string | null;
  twitter: string | null;
  socialLinksOrder: string[] | null;
}

function SocialLinksEditor({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://prisma-backend-production-4c22.up.railway.app/user-profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        organizeLinks(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Organizar links conforme a ordem salva
  const organizeLinks = (profileData: UserProfile) => {
    const order = profileData.socialLinksOrder || [
      'linkedin',
      'github',
      'portfolio',
      'instagram',
      'twitter',
    ];

    const linksMap: Record<string, SocialLink> = {
      linkedin: {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        url: profileData.linkedin,
      },
      github: {
        id: 'github',
        name: 'GitHub',
        icon: '💻',
        url: profileData.github,
      },
      portfolio: {
        id: 'portfolio',
        name: 'Portfolio',
        icon: '🌐',
        url: profileData.portfolio,
      },
      instagram: {
        id: 'instagram',
        name: 'Instagram',
        icon: '📷',
        url: profileData.instagram,
      },
      twitter: {
        id: 'twitter',
        name: 'Twitter',
        icon: '🐦',
        url: profileData.twitter,
      },
    };

    // Ordenar conforme socialLinksOrder
    const orderedLinks = order.map((linkId) => linksMap[linkId]);
    setSocialLinks(orderedLinks);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(socialLinks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSocialLinks(items);

    // Salvar nova ordem no backend
    await saveOrder(items);
  };

  const saveOrder = async (newOrder: SocialLink[]) => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const orderIds = newOrder.map((link) => link.id);

      const response = await fetch(
        'https://prisma-backend-production-4c22.up.railway.app/user-profile/social-links-order',
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            socialLinksOrder: orderIds,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Atualizar perfil local com nova ordem
        if (profile) {
          setProfile({
            ...profile,
            socialLinksOrder: orderIds,
          });
        }
        alert('Ordem atualizada com sucesso!');
      } else {
        throw new Error(data.message || 'Erro ao atualizar ordem');
      }
    } catch (error: any) {
      console.error('Erro ao salvar ordem:', error);
      alert('Erro ao salvar ordem: ' + error.message);
      // Reverter para ordem anterior
      if (profile) {
        organizeLinks(profile);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="social-links-editor">
      <h2>Ordenar Links Sociais</h2>
      <p>Arraste os itens para reordenar</p>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="social-links">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="links-list"
            >
              {socialLinks.map((link, index) => (
                <Draggable
                  key={link.id}
                  draggableId={link.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`link-item ${
                        snapshot.isDragging ? 'dragging' : ''
                      }`}
                      style={{
                        ...provided.draggableProps.style,
                        cursor: 'grab',
                      }}
                    >
                      <span className="drag-handle">☰</span>
                      <span className="icon">{link.icon}</span>
                      <span className="name">{link.name}</span>
                      {link.url ? (
                        <span className="status">✓ Preenchido</span>
                      ) : (
                        <span className="status empty">Vazio</span>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {saving && <div className="saving">Salvando...</div>}
    </div>
  );
}

export default SocialLinksEditor;
```

### Exibição dos Links Ordenados

```tsx
function SocialLinksDisplay({ profile }: { profile: UserProfile }) {
  const order = profile.socialLinksOrder || [
    'linkedin',
    'github',
    'portfolio',
    'instagram',
    'twitter',
  ];

  const links = {
    linkedin: { name: 'LinkedIn', icon: '💼', url: profile.linkedin },
    github: { name: 'GitHub', icon: '💻', url: profile.github },
    portfolio: { name: 'Portfolio', icon: '🌐', url: profile.portfolio },
    instagram: { name: 'Instagram', icon: '📷', url: profile.instagram },
    twitter: { name: 'Twitter', icon: '🐦', url: profile.twitter },
  };

  return (
    <div className="social-links">
      {order.map((linkId) => {
        const link = links[linkId as keyof typeof links];
        if (!link.url) return null; // Não mostrar links vazios

        return (
          <a
            key={linkId}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <span className="icon">{link.icon}</span>
            <span className="name">{link.name}</span>
          </a>
        );
      })}
    </div>
  );
}
```

## 🎨 Estilos CSS

```css
.social-links-editor {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.link-item.dragging {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  background: #e7f3ff;
}

.drag-handle {
  font-size: 1.2rem;
  color: #666;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.icon {
  font-size: 1.5rem;
}

.name {
  flex: 1;
  font-weight: 500;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  background: #d4edda;
  color: #155724;
}

.status.empty {
  background: #f8d7da;
  color: #721c24;
}

.saving {
  margin-top: 1rem;
  text-align: center;
  color: #007bff;
  font-weight: 500;
}

/* Exibição dos links */
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.social-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}
```

## 📝 Validações Importantes

### No Frontend (antes de enviar):

```typescript
function validateOrder(order: string[]): { valid: boolean; error?: string } {
  const validLinks = ['linkedin', 'github', 'portfolio', 'instagram', 'twitter'];

  // Verificar tamanho
  if (order.length !== 5) {
    return { valid: false, error: 'Deve conter exatamente 5 links' };
  }

  // Verificar se contém todos os links válidos
  const hasAllLinks = validLinks.every((link) => order.includes(link));
  if (!hasAllLinks) {
    return { valid: false, error: 'Faltam links obrigatórios' };
  }

  // Verificar se contém apenas links válidos
  const hasOnlyValidLinks = order.every((link) => validLinks.includes(link));
  if (!hasOnlyValidLinks) {
    return { valid: false, error: 'Contém links inválidos' };
  }

  // Verificar duplicatas
  const uniqueLinks = new Set(order);
  if (uniqueLinks.size !== order.length) {
    return { valid: false, error: 'Não pode ter links duplicados' };
  }

  return { valid: true };
}
```

## 🔄 Fluxo Completo

1. **Carregar Perfil:**
   - Fazer GET em `/user-profile/:userId`
   - Extrair `socialLinksOrder` (ou usar ordem padrão se null)
   - Organizar links conforme a ordem

2. **Permitir Reordenação:**
   - Usar drag and drop (react-beautiful-dnd, dnd-kit, etc.)
   - Atualizar estado local imediatamente (feedback visual)

3. **Salvar Ordem:**
   - Fazer PUT em `/user-profile/social-links-order`
   - Enviar array com IDs na nova ordem
   - Atualizar estado local após sucesso

4. **Exibir Links:**
   - Usar `socialLinksOrder` para ordenar
   - Filtrar links vazios (opcional)
   - Renderizar na ordem correta

## ⚠️ Tratamento de Erros

```typescript
try {
  const response = await fetch(/* ... */);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 400) {
      // Validação falhou
      alert(data.message || 'Ordem inválida');
    } else if (response.status === 401) {
      // Não autenticado
      alert('Sessão expirada. Faça login novamente.');
    } else {
      // Outro erro
      alert('Erro ao salvar ordem');
    }
    return;
  }

  // Sucesso
  console.log('Ordem salva:', data.data.socialLinksOrder);
} catch (error) {
  console.error('Erro de rede:', error);
  alert('Erro de conexão. Tente novamente.');
}
```

## 🎯 Checklist de Implementação

- [ ] Instalar biblioteca de drag and drop (react-beautiful-dnd, @dnd-kit/core, etc.)
- [ ] Criar componente de edição com drag and drop
- [ ] Implementar validação no frontend antes de enviar
- [ ] Implementar tratamento de erros
- [ ] Adicionar feedback visual durante o arraste
- [ ] Adicionar indicador de salvamento
- [ ] Implementar exibição ordenada dos links
- [ ] Testar com diferentes ordens
- [ ] Testar validações (links faltando, duplicados, etc.)

## 📚 Bibliotecas Recomendadas

- **react-beautiful-dnd** - Drag and drop popular e bem documentado
- **@dnd-kit/core** - Alternativa moderna e acessível
- **react-sortable-hoc** - Outra opção popular

## 💡 Dicas

1. **Feedback Visual:** Mostre claramente quando um item está sendo arrastado
2. **Salvamento Automático:** Salve automaticamente após o drag, sem precisar de botão
3. **Otimismo:** Atualize a UI imediatamente, reverta apenas se houver erro
4. **Acessibilidade:** Use bibliotecas que suportam teclado e screen readers
5. **Mobile:** Teste em dispositivos móveis (algumas bibliotecas têm melhor suporte)


