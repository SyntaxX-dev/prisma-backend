# 🤖 Integração com Gemini AI

Este projeto agora inclui integração com a API do Google Gemini para organizar automaticamente vídeos de playlists do YouTube em módulos lógicos.

## 🚀 Configuração

### 1. Obter API Key do Gemini

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

Adicione a seguinte variável no seu arquivo `.env`:

```env
GEMINI_API_KEY=sua-chave-do-gemini-aqui
```

### 3. Deploy no Railway

No Railway, adicione a variável de ambiente:

```bash
GEMINI_API_KEY=sua-chave-do-gemini-aqui
```

## 📚 Como Usar

### Endpoint Atualizado

```http
POST /courses/process-youtube-playlist
Content-Type: application/json
Authorization: Bearer <seu-jwt-token>

{
  "courseId": "uuid-do-curso",
  "subCourseName": "Curso React Completo",
  "subCourseDescription": "Curso completo de React",
  "aiPrompt": "Organize os vídeos em módulos lógicos. Agrupe vídeos relacionados em módulos de 5-8 vídeos cada. Crie módulos como: 'Fundamentos', 'Conceitos Avançados', 'Projeto Prático', etc.",
  "videos": [
    {
      "videoId": "FXqX7oof0I4",
      "title": "Curso React: Introdução - #01",
      "description": "...",
      "url": "https://www.youtube.com/watch?v=FXqX7oof0I4",
      "duration": 705,
      "tags": ["react", "javascript"]
    }
  ]
}
```

### Prompt Personalizado

O campo `aiPrompt` é opcional e permite personalizar como a IA deve organizar os vídeos:

**Exemplo de Prompts:**

```json
{
  "aiPrompt": "Organize os vídeos em módulos temáticos. Agrupe por conceitos similares: Fundamentos (vídeos 1-5), Hooks (vídeos 6-10), Projeto Prático (vídeos 11-15)."
}
```

```json
{
  "aiPrompt": "Crie módulos de 4-6 vídeos cada. Foque em agrupar por funcionalidades: Componentes, Estado, Props, Eventos, etc."
}
```

## 🧠 Como Funciona

1. **Análise da IA**: O Gemini analisa títulos, descrições e tags dos vídeos
2. **Organização Inteligente**: Agrupa vídeos relacionados por tópicos/conceitos
3. **Nomes Descritivos**: Cria nomes de módulos profissionais e descritivos
4. **Fallback**: Se a API falhar, usa algoritmo local como backup

## 🔧 Fallback Automático

Se a API do Gemini não estiver disponível ou falhar:

- ✅ **Algoritmo local** é usado automaticamente
- ✅ **Funcionalidade preservada** - o endpoint continua funcionando
- ✅ **Logs de erro** são registrados para debug

## 📊 Exemplo de Resposta

```json
{
  "success": true,
  "message": "Playlist processada com sucesso! Criados 3 módulos com 15 vídeos.",
  "data": {
    "subCourse": {
      "id": "uuid-do-subcurso",
      "name": "Curso React Completo"
    },
    "modules": [
      {
        "id": "uuid-do-modulo",
        "name": "Fundamentos do React",
        "description": "Conceitos básicos e introdução ao React",
        "order": 0,
        "videoCount": 5,
        "videos": [...]
      },
      {
        "id": "uuid-do-modulo-2",
        "name": "Hooks e Estado",
        "description": "Gerenciamento de estado com hooks",
        "order": 1,
        "videoCount": 6,
        "videos": [...]
      }
    ]
  }
}
```

## 🎯 Vantagens da IA

- **Organização Inteligente**: Agrupa vídeos por tópicos relacionados
- **Nomes Profissionais**: Cria nomes de módulos descritivos
- **Flexibilidade**: Permite prompts personalizados
- **Confiabilidade**: Fallback automático em caso de erro
- **Escalabilidade**: Funciona com qualquer quantidade de vídeos

## 🆘 Troubleshooting

- **Erro de API**: Verifique se `GEMINI_API_KEY` está configurada
- **Rate Limit**: A API tem limites de uso (gratuita: 15 requests/minuto)
- **Timeout**: Requests podem demorar 5-10 segundos para processar
- **Fallback**: Se houver erro, o algoritmo local é usado automaticamente

**🎉 Agora você tem IA real organizando seus vídeos automaticamente!**
