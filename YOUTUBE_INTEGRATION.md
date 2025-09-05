# Integração com YouTube Data API v3

Este projeto inclui uma integração completa com a YouTube Data API v3 para extrair dados de vídeos e playlists do YouTube de forma organizada para seu SaaS de cursos online.

## 🚀 Configuração

### 1. Obter API Key do YouTube

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Habilite a **YouTube Data API v3**
4. Vá em "Credenciais" e crie uma **Chave de API**
5. Copie a chave gerada

### 2. Configurar Variáveis de Ambiente

Adicione a seguinte variável no seu arquivo `.env`:

```env
YOUTUBE_API_KEY=sua-chave-da-api-aqui
```

### 3. Instalar Dependências

As dependências já foram instaladas automaticamente:

```bash
npm install googleapis
```

## 📚 Endpoints Disponíveis

### Buscar Vídeos

```http
POST /youtube/search
Content-Type: application/json
Authorization: Bearer <seu-jwt-token>

{
  "query": "NestJS tutorial",
  "maxResults": 10,
  "order": "relevance"
}
```

### Obter Vídeo por ID

```http
GET /youtube/video/{videoId}
Authorization: Bearer <seu-jwt-token>
```

### Obter Vídeos de Playlist

```http
GET /youtube/playlist/{playlistId}?maxResults=50
Authorization: Bearer <seu-jwt-token>
```

### Obter Informações da Playlist

```http
GET /youtube/playlist/{playlistId}/info
Authorization: Bearer <seu-jwt-token>
```

### Extrair Dados de URL de Vídeo

```http
POST /youtube/extract-from-url
Content-Type: application/json
Authorization: Bearer <seu-jwt-token>

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

### Extrair Dados de URL de Playlist

```http
POST /youtube/extract-playlist-from-url
Content-Type: application/json
Authorization: Bearer <seu-jwt-token>

{
  "url": "https://www.youtube.com/playlist?list=PLAYLIST_ID"
}
```

### Extrair Vídeos de URL de Playlist

```http
POST /youtube/extract-playlist-videos-from-url
Content-Type: application/json
Authorization: Bearer <seu-jwt-token>

{
  "url": "https://www.youtube.com/playlist?list=PLAYLIST_ID",
  "maxResults": 50
}
```

## 🔧 Exemplo de Uso

### Testando a API

Execute o script de exemplo para testar a integração:

```bash
node scripts/youtube-example.js
```

### Usando no Código

```typescript
import { YouTubeService } from './infrastructure/services/youtube.service';

// Injetar o serviço
constructor(private youtubeService: YouTubeService) {}

// Buscar vídeos
const videos = await this.youtubeService.searchVideos({
  query: 'React tutorial',
  maxResults: 10,
  order: 'relevance'
});

// Obter vídeo específico
const video = await this.youtubeService.getVideoById('VIDEO_ID');

// Obter vídeos de playlist
const playlistVideos = await this.youtubeService.getPlaylistVideos('PLAYLIST_ID', 50);
```

## 📊 Dados Retornados

Cada vídeo retorna as seguintes informações:

```typescript
{
  videoId: string;           // ID único do vídeo
  title: string;             // Título do vídeo
  description?: string;      // Descrição do vídeo
  url: string;              // URL completa do vídeo
  thumbnailUrl: string;     // URL da thumbnail
  duration: number;         // Duração em segundos
  channelTitle: string;     // Nome do canal
  publishedAt: string;      // Data de publicação
  viewCount: number;        // Número de visualizações
  tags?: string[];          // Tags do vídeo
  category?: string;        // Categoria do vídeo
}
```

## 🎯 Casos de Uso para SaaS de Cursos

### 1. Organizar Conteúdo por Categoria

```typescript
// Buscar vídeos sobre programação
const programmingVideos = await this.youtubeService.searchVideos({
  query: 'programming tutorial',
  maxResults: 20,
  order: 'viewCount'
});
```

### 2. Criar Playlists de Cursos

```typescript
// Obter todos os vídeos de uma playlist de curso
const courseVideos = await this.youtubeService.getPlaylistVideos(
  'PL_c9BZzLwZRLbbpSf-VBzZ1aCOT1bE4xT', // ID da playlist
  100
);
```

### 3. Extrair Metadados para Organização

```typescript
// Extrair dados de vídeos individuais para catalogar
const videoData = await this.youtubeService.getVideoById('dQw4w9WgXcQ');
```

## ⚠️ Limitações e Considerações

### Quotas da API

- **10.000 unidades por dia** (gratuito)
- **1 unidade por busca simples**
- **100 unidades por vídeo com detalhes completos**

### Boas Práticas

1. **Cache os resultados** para evitar chamadas desnecessárias
2. **Use paginação** para grandes volumes de dados
3. **Implemente rate limiting** para respeitar as quotas
4. **Monitore o uso** da API regularmente

### Exemplo de Cache

```typescript
@Injectable()
export class CachedYouTubeService {
  private cache = new Map<string, any>();
  
  async getVideoById(videoId: string) {
    const cacheKey = `video_${videoId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const video = await this.youtubeService.getVideoById(videoId);
    this.cache.set(cacheKey, video);
    
    return video;
  }
}
```

## 🚨 Tratamento de Erros

A API inclui tratamento robusto de erros:

- **403 Forbidden**: API key inválida ou API não habilitada
- **400 Bad Request**: Parâmetros inválidos
- **404 Not Found**: Vídeo ou playlist não encontrado
- **429 Too Many Requests**: Quota excedida

## 📈 Monitoramento

Para monitorar o uso da API:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em "APIs e Serviços" > "Dashboard"
3. Selecione "YouTube Data API v3"
4. Monitore as métricas de uso

## 🔐 Segurança

- **Nunca exponha sua API key** no frontend
- **Use variáveis de ambiente** para armazenar a chave
- **Implemente autenticação** nos endpoints
- **Monitore o uso** para detectar abusos

## 📝 Próximos Passos

1. **Implementar cache** para otimizar performance
2. **Adicionar filtros** por duração, data, etc.
3. **Criar sistema de favoritos** para usuários
4. **Implementar busca avançada** com múltiplos critérios
5. **Adicionar métricas** de engajamento dos vídeos
