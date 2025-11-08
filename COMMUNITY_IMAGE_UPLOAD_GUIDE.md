# 📸 Guia de Upload de Imagem para Comunidades

## Endpoints Disponíveis

### 1. Upload durante a criação da comunidade ⭐ (Recomendado)
**POST** `/communities`

### 2. Upload após criar a comunidade
**POST** `/communities/:id/image`

---

## 📝 Endpoint 1: Criar Comunidade com Imagem

**POST** `/communities`

### Autenticação

✅ **Requer autenticação** - Token JWT no header `Authorization: Bearer <token>`

### Permissões

- Qualquer usuário autenticado pode criar comunidade
- O criador automaticamente se torna dono e membro

### Request

#### Opção A: Com upload de arquivo (multipart/form-data) ⭐ Recomendado

**Headers**
```
Authorization: Bearer <seu-token-jwt>
Content-Type: multipart/form-data
```

**Body (Form Data)**
- `name` (string, obrigatório) - Nome da comunidade
- `focus` (string, obrigatório) - Foco da comunidade
- `description` (string, opcional) - Descrição
- `visibility` (string, obrigatório) - "PUBLIC" ou "PRIVATE"
- `image` (file, opcional) - Arquivo de imagem (JPG, PNG, GIF, WebP, máx 5MB)

#### Opção B: Com URL de imagem (application/json)

**Headers**
```
Authorization: Bearer <seu-token-jwt>
Content-Type: application/json
```

**Body (JSON)**
```json
{
  "name": "Comunidade PRF",
  "focus": "PRF",
  "description": "Estudos para PRF",
  "visibility": "PUBLIC",
  "image": "https://exemplo.com/imagem.png"
}
```

#### Opção C: Sem imagem (application/json)

**Body (JSON)**
```json
{
  "name": "Comunidade PRF",
  "focus": "PRF",
  "description": "Estudos para PRF",
  "visibility": "PUBLIC"
}
```

### Exemplo usando JavaScript/Fetch (com upload)

```javascript
const createCommunityWithImage = async (communityData, imageFile, token) => {
  const formData = new FormData();
  formData.append('name', communityData.name);
  formData.append('focus', communityData.focus);
  formData.append('description', communityData.description || '');
  formData.append('visibility', communityData.visibility);
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(
    'https://seu-backend.railway.app/communities',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  const data = await response.json();
  return data;
};

// Uso
const communityData = {
  name: 'Comunidade PRF 2024',
  focus: 'PRF',
  description: 'Estudos para PRF',
  visibility: 'PUBLIC'
};

const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

createCommunityWithImage(communityData, file, token)
  .then(result => {
    console.log('Comunidade criada:', result.data);
    console.log('Imagem:', result.data.image);
  })
  .catch(error => {
    console.error('Erro:', error);
  });
```

### Exemplo usando React

```jsx
import { useState } from 'react';

function CreateCommunityForm({ token }) {
  const [formData, setFormData] = useState({
    name: '',
    focus: '',
    description: '',
    visibility: 'PUBLIC'
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('focus', formData.focus);
      data.append('description', formData.description);
      data.append('visibility', formData.visibility);
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await fetch(
        'https://seu-backend.railway.app/communities',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: data
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar comunidade');
      }

      alert('Comunidade criada com sucesso!');
      console.log('Comunidade:', result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nome da comunidade"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Foco (ex: PRF, ENEM)"
        value={formData.focus}
        onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
        required
      />
      <textarea
        placeholder="Descrição"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <select
        value={formData.visibility}
        onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
      >
        <option value="PUBLIC">Pública</option>
        <option value="PRIVATE">Privada</option>
      </select>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Comunidade'}
      </button>
    </form>
  );
}
```

### Response

#### Sucesso (201)

```json
{
  "success": true,
  "data": {
    "id": "uuid-da-comunidade",
    "name": "Comunidade PRF 2024",
    "focus": "PRF",
    "description": "Estudos para PRF",
    "image": "https://res.cloudinary.com/dgdefptw3/image/upload/v1234567890/community-images/abc123.jpg",
    "visibility": "PUBLIC",
    "ownerId": "uuid-do-criador",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Erros

- **400**: Dados inválidos, tipo de arquivo não permitido, arquivo muito grande
- **401**: Não autenticado
- **400**: Nome de comunidade já existe

---

## 📝 Endpoint 2: Upload de Imagem Após Criação

**POST** `/communities/:id/image`

### Autenticação

✅ **Requer autenticação** - Token JWT no header `Authorization: Bearer <token>`

### Permissões

- Apenas o **dono da comunidade** pode fazer upload de imagem
- O sistema verifica automaticamente se o usuário autenticado é o dono

## Request

### Headers
```
Authorization: Bearer <seu-token-jwt>
Content-Type: multipart/form-data
```

### Body (Form Data)
- Campo: `image` (tipo: file)
- Formatos aceitos: JPG, JPEG, PNG, GIF, WebP
- Tamanho máximo: **5MB**

### Exemplo usando JavaScript/Fetch

```javascript
const uploadCommunityImage = async (communityId, imageFile, token) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(
    `https://seu-backend.railway.app/communities/${communityId}/image`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // NÃO inclua Content-Type - o browser define automaticamente para FormData
      },
      body: formData
    }
  );

  const data = await response.json();
  return data;
};

// Uso
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const communityId = 'uuid-da-comunidade';
const token = 'seu-token-jwt';

uploadCommunityImage(communityId, file, token)
  .then(result => {
    console.log('Imagem enviada:', result.data.image);
  })
  .catch(error => {
    console.error('Erro:', error);
  });
```

### Exemplo usando React

```jsx
import { useState } from 'react';

function CommunityImageUpload({ communityId, token }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validação no frontend
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(
        `https://seu-backend.railway.app/communities/${communityId}/image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer upload');
      }

      setImageUrl(data.data.image);
      alert('Imagem enviada com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Enviando imagem...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && (
        <div>
          <p>Imagem enviada com sucesso!</p>
          <img src={imageUrl} alt="Comunidade" style={{ maxWidth: '200px' }} />
        </div>
      )}
    </div>
  );
}
```

### Exemplo usando Axios

```javascript
import axios from 'axios';

const uploadCommunityImage = async (communityId, imageFile, token) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await axios.post(
      `https://seu-backend.railway.app/communities/${communityId}/image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao fazer upload');
  }
};
```

## Response

### Sucesso (200)

```json
{
  "success": true,
  "message": "Imagem da comunidade enviada com sucesso",
  "data": {
    "image": "https://res.cloudinary.com/dgdefptw3/image/upload/v1234567890/community-images/abc123.jpg"
  }
}
```

### Erros

#### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP",
  "error": "Bad Request"
}
```

#### 403 - Forbidden
```json
{
  "statusCode": 403,
  "message": "Apenas o dono da comunidade pode fazer upload de imagem",
  "error": "Forbidden"
}
```

#### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Comunidade não encontrada",
  "error": "Not Found"
}
```

#### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Processamento da Imagem

- A imagem é processada pelo **Cloudinary**
- Dimensões: 800x600px (redimensionada automaticamente)
- Formato: otimizado automaticamente (WebP quando possível)
- Pasta: `community-images/` no Cloudinary
- A URL retornada é permanente e pode ser usada diretamente

## Fluxo Completo

### Opção 1: Criar comunidade com imagem (Recomendado)

```javascript
// Criar comunidade e fazer upload da imagem ao mesmo tempo
const formData = new FormData();
formData.append('name', 'Comunidade PRF');
formData.append('focus', 'PRF');
formData.append('description', 'Estudos para PRF');
formData.append('visibility', 'PUBLIC');
formData.append('image', fileInput.files[0]); // Arquivo de imagem

const response = await fetch('https://seu-backend.railway.app/communities', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
// A comunidade já é criada com a imagem!
```

### Opção 2: Criar comunidade e depois fazer upload

1. **Criar comunidade** (sem imagem inicial)
   ```javascript
   POST /communities
   {
     "name": "Comunidade PRF",
     "focus": "PRF",
     "visibility": "PUBLIC"
   }
   ```

2. **Fazer upload da imagem**
   ```javascript
   POST /communities/{id}/image
   FormData: { image: file }
   ```

### Opção 3: Criar comunidade com URL de imagem

```javascript
POST /communities
{
  "name": "Comunidade PRF",
  "focus": "PRF",
  "visibility": "PUBLIC",
  "image": "https://exemplo.com/imagem.png"
}
```

### Visualização

A imagem é salva automaticamente na comunidade e pode ser visualizada em:
   - `GET /communities/{id}` - retorna o campo `image`
   - `GET /communities` - retorna o campo `image` em cada item

## Notas Importantes

- ⚠️ A imagem anterior é **substituída** quando um novo upload é feito
- ⚠️ Não há endpoint para **deletar** a imagem (pode ser adicionado se necessário)
- ✅ A imagem é validada antes do upload (tipo e tamanho)
- ✅ Apenas o dono pode fazer upload (verificação automática)
- ✅ A imagem é otimizada automaticamente pelo Cloudinary

