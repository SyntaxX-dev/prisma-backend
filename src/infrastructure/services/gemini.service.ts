import { Injectable } from '@nestjs/common';

export interface VideoData {
  videoId: string;
  title: string;
  description?: string;
  duration?: number;
  tags?: string[];
}

export interface ModuleSuggestion {
  name: string;
  description: string;
  videoIndices: number[];
}

export interface PlaylistAnalysisData {
  playlistId: string;
  playlistTitle: string;
  playlistDescription?: string;
  channelName: string;
  channelId?: string;
  videos: VideoData[];
}

export interface CourseSuggestion {
  courseName: string; // Nome geral do curso (ex: "Biologia", "React")
  subCourses: SubCourseSuggestion[];
}

export interface SubCourseSuggestion {
  subCourseName: string; // Ex: "Biomas do Brasil - Jubilut"
  playlistId: string;
  modules: ModuleSuggestion[];
}

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn(
        'GEMINI_API_KEY não configurada. Usando algoritmo local como fallback.',
      );
    }
  }

  async organizeVideosIntoModules(
    videos: VideoData[],
    customPrompt?: string,
  ): Promise<ModuleSuggestion[]> {
    if (!this.apiKey) {
      // Fallback para algoritmo local se não tiver API key
      return this.fallbackAlgorithm(videos);
    }

    try {
      const prompt = this.buildPrompt(videos, customPrompt);
      const response = await this.callGeminiAPI(prompt);
      return this.parseGeminiResponse(response);
    } catch (error) {
      console.error('Erro ao chamar Gemini API:', error);
      // Fallback para algoritmo local em caso de erro
      return this.fallbackAlgorithm(videos);
    }
  }

  private buildPrompt(videos: VideoData[], customPrompt?: string): string {
    const defaultPrompt = `
Você é um especialista em organização de conteúdo educacional. Analise a lista de vídeos abaixo e organize-os em módulos lógicos e sequenciais.

INSTRUÇÕES:
- Agrupe vídeos relacionados em módulos 
- Mantenha a ordem sequencial dos vídeos
- Crie nomes de módulos descritivos e profissionais relacionados ao conteúdo dos vídeos, não pode ser muito grande.
- Foque em agrupar por tópicos/conceitos similares
- Evite criar muitos módulos pequenos ou módulos com muitos vídeos

${customPrompt ? `PROMPT PERSONALIZADO: ${customPrompt}` : ''}

VÍDEOS PARA ORGANIZAR (apenas títulos):
${videos.map((video, index) => `${index}: "${video.title}"`).join('\n')}

Responda APENAS com um JSON no seguinte formato:
{
  "modules": [
    {
      "name": "Nome do Módulo",
      "description": "Descrição do que será ensinado neste módulo",
      "videoIndices": [0, 1, 2, 3]
    }
  ]
}
`;

    return defaultPrompt;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log('Resposta bruta da API Gemini:', JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Nenhum candidato encontrado na resposta da API');
    }

    // Verificar se a resposta foi cortada por limite de tokens
    if (data.candidates[0].finishReason === 'MAX_TOKENS') {
      throw new Error('Resposta cortada por limite de tokens - use fallback');
    }

    if (
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      data.candidates[0].content.parts.length === 0
    ) {
      throw new Error('Estrutura de resposta inválida da API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private parseGeminiResponse(response: string): ModuleSuggestion[] {
    try {
      // Extrair JSON da resposta (pode ter texto antes/depois)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(
        'Resposta parseada do Gemini:',
        JSON.stringify(parsed, null, 2),
      );
      return parsed.modules || [];
    } catch (error) {
      console.error('Erro ao parsear resposta do Gemini:', error);
      console.error('Resposta original:', response);
      throw error;
    }
  }

  private fallbackAlgorithm(videos: VideoData[]): ModuleSuggestion[] {
    // Algoritmo local como fallback
    const modules: ModuleSuggestion[] = [];
    const videosPerModule = 6; // 6 vídeos por módulo

    for (let i = 0; i < videos.length; i += videosPerModule) {
      const moduleVideos = videos.slice(i, i + videosPerModule);
      const moduleNumber = Math.floor(i / videosPerModule) + 1;

      modules.push({
        name: `Módulo ${moduleNumber}`,
        description: `Conteúdo do módulo ${moduleNumber} com ${moduleVideos.length} vídeos`,
        videoIndices: moduleVideos.map((_, index) => i + index),
      });
    }

    return modules;
  }

  /**
   * Analisa múltiplas playlists e sugere cursos, subcursos e módulos
   */
  async analyzePlaylistsForCourses(
    playlists: PlaylistAnalysisData[],
    existingCourseNames: string[],
    customPrompt?: string,
  ): Promise<CourseSuggestion[]> {
    if (!this.apiKey) {
      return this.fallbackCourseSuggestion(playlists);
    }

    try {
      const prompt = this.buildCourseAnalysisPrompt(
        playlists,
        existingCourseNames,
        customPrompt,
      );
      const response = await this.callGeminiAPI(prompt);
      return this.parseCourseSuggestionResponse(response, playlists);
    } catch (error) {
      console.error('Erro ao analisar playlists para cursos:', error);
      return this.fallbackCourseSuggestion(playlists);
    }
  }

  private buildCourseAnalysisPrompt(
    playlists: PlaylistAnalysisData[],
    existingCourseNames: string[],
    customPrompt?: string,
  ): string {
    const existingCoursesList =
      existingCourseNames.length > 0
        ? `\n\nCURSOS JÁ EXISTENTES (não criar duplicatas):\n${existingCourseNames.join(', ')}`
        : '\n\nNenhum curso existe ainda.';

    const playlistsData = playlists
      .map((playlist, idx) => {
        const videosList = playlist.videos
          .map((v, vidx) => `${vidx}: "${v.title}"`)
          .join('\n');
        return `
PLAYLIST ${idx + 1}:
- ID: ${playlist.playlistId}
- Título: ${playlist.playlistTitle}
- Canal: ${playlist.channelName}
- Descrição: ${playlist.playlistDescription || 'N/A'}
- Vídeos (${playlist.videos.length}):
${videosList}
`;
      })
      .join('\n---\n');

    return `
Você é um especialista em organização de conteúdo educacional. Analise as playlists do YouTube abaixo e organize-as em uma estrutura de cursos.

REGRAS IMPORTANTES:
1. NOME DO CURSO: Deve ser um tema geral único (ex: "Biologia", "Matemática", "React", "Português")
   - Use os nomes existentes se o tema corresponder a um curso já existente
   - Não crie duplicatas de cursos
   
2. NOME DO SUBCURSO: Deve ser "Tema da Playlist - Nome do Professor/Canal"
   - Exemplo: "Biomas do Brasil - Jubilut"
   - Se não houver nome de professor explícito, use o nome do canal
   
3. MÓDULOS: Organize os vídeos em módulos lógicos dentro de cada subcurso
   - Agrupe vídeos relacionados
   - Mantenha sequência lógica
   - Crie nomes descritivos e profissionais

4. ESTRUTURA:
   - Cada playlist deve gerar 1 subcurso
   - Subcursos relacionados devem estar no mesmo curso
   - Analise títulos, descrições e conteúdo para determinar o curso correto

${existingCoursesList}

PLAYLISTS PARA ANALISAR:
${playlistsData}

${customPrompt ? `\nPROMPT PERSONALIZADO: ${customPrompt}` : ''}

Responda APENAS com um JSON no seguinte formato:
{
  "courses": [
    {
      "courseName": "Nome do Curso (tema geral)",
      "subCourses": [
        {
          "playlistId": "ID da playlist",
          "subCourseName": "Tema - Professor/Canal",
          "modules": [
            {
              "name": "Nome do Módulo",
              "description": "Descrição do módulo",
              "videoIndices": [0, 1, 2]
            }
          ]
        }
      ]
    }
  ]
}
`;
  }

  private parseCourseSuggestionResponse(
    response: string,
    playlists: PlaylistAnalysisData[],
  ): CourseSuggestion[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(
        'Resposta parseada do Gemini (cursos):',
        JSON.stringify(parsed, null, 2),
      );

      if (!parsed.courses || !Array.isArray(parsed.courses)) {
        throw new Error(
          'Estrutura de resposta inválida - campo "courses" não encontrado',
        );
      }

      // Validar que todos os playlistIds foram incluídos
      const processedPlaylistIds = new Set<string>();
      parsed.courses.forEach((course: any) => {
        course.subCourses?.forEach((subCourse: any) => {
          if (subCourse.playlistId) {
            processedPlaylistIds.add(subCourse.playlistId);
          }
        });
      });

      const allPlaylistIds = new Set(playlists.map((p) => p.playlistId));
      const missing = Array.from(allPlaylistIds).filter(
        (id) => !processedPlaylistIds.has(id),
      );

      if (missing.length > 0) {
        console.warn('Algumas playlists não foram processadas:', missing);
      }

      return parsed.courses as CourseSuggestion[];
    } catch (error) {
      console.error('Erro ao parsear resposta do Gemini:', error);
      console.error('Resposta original:', response);
      throw error;
    }
  }

  private fallbackCourseSuggestion(
    playlists: PlaylistAnalysisData[],
  ): CourseSuggestion[] {
    // Algoritmo fallback: uma playlist = um subcurso, organiza por nome do canal
    const coursesMap = new Map<string, CourseSuggestion>();

    playlists.forEach((playlist) => {
      // Extrair tema geral do título (primeira palavra ou tema principal)
      const courseName = this.extractCourseNameFromPlaylist(
        playlist.playlistTitle,
      );

      if (!coursesMap.has(courseName)) {
        coursesMap.set(courseName, {
          courseName,
          subCourses: [],
        });
      }

      const course = coursesMap.get(courseName)!;
      const subCourseName = `${playlist.playlistTitle} - ${playlist.channelName}`;

      // Organizar vídeos em módulos simples (6 vídeos por módulo)
      const modules: ModuleSuggestion[] = [];
      const videosPerModule = 6;

      for (let i = 0; i < playlist.videos.length; i += videosPerModule) {
        const moduleNumber = Math.floor(i / videosPerModule) + 1;
        modules.push({
          name: `Módulo ${moduleNumber}`,
          description: `Conteúdo do módulo ${moduleNumber}`,
          videoIndices: playlist.videos
            .slice(i, i + videosPerModule)
            .map((_, idx) => i + idx),
        });
      }

      course.subCourses.push({
        subCourseName,
        playlistId: playlist.playlistId,
        modules,
      });
    });

    return Array.from(coursesMap.values());
  }

  private extractCourseNameFromPlaylist(playlistTitle: string): string {
    // Tentar extrair tema geral do título
    const title = playlistTitle.toLowerCase();

    // Palavras-chave comuns de cursos
    const keywords: Record<string, string> = {
      biologia: 'Biologia',
      matemática: 'Matemática',
      português: 'Português',
      portugues: 'Português',
      react: 'React',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      node: 'Node.js',
      python: 'Python',
      java: 'Java',
      teologia: 'Teologia',
      história: 'História',
      historia: 'História',
      geografia: 'Geografia',
      física: 'Física',
      fisica: 'Física',
      química: 'Química',
      quimica: 'Química',
    };

    for (const [key, courseName] of Object.entries(keywords)) {
      if (title.includes(key)) {
        return courseName;
      }
    }

    // Se não encontrar, usar primeira palavra capitalizada
    const firstWord = playlistTitle.split(/\s+/)[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }

  /**
   * Gera um mapa mental ou resumo em texto sobre um vídeo usando Gemini AI
   * @param generationType 'mindmap' para mapa mental visual, 'text' para resumo em texto
   */
  async generateMindMap(
    videoTitle: string,
    videoDescription: string,
    videoUrl: string,
    generationType: 'mindmap' | 'text' = 'mindmap',
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const maxRetries = 3;
    let lastError: any;

    const typeLabel = generationType === 'mindmap' ? 'mapa mental' : 'resumo em texto';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[MindMap] Tentativa ${attempt}/${maxRetries} - Gerando ${typeLabel}`,
        );
        const prompt = generationType === 'mindmap'
          ? this.buildMindMapPrompt(videoTitle, videoDescription, videoUrl)
          : this.buildTextSummaryPrompt(videoTitle, videoDescription, videoUrl);
        const response = await this.callGeminiAPI(prompt);
        console.log(`[MindMap] ✅ ${typeLabel} gerado com sucesso`);
        return response;
      } catch (error) {
        lastError = error;
        console.error(`[MindMap] ❌ Erro na tentativa ${attempt}:`, error);

        // Se não for a última tentativa, aguardar antes de retry
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000; // 2s, 4s, 6s
          console.log(
            `[MindMap] ⏳ Aguardando ${waitTime}ms antes de tentar novamente...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error('[MindMap] ❌ Todas as tentativas falhar');
    throw new Error(
      `Erro ao gerar mapa mental após ${maxRetries} tentativas: ${lastError?.message || 'Erro desconhecido'}`,
    );
  }

  private buildMindMapPrompt(
    videoTitle: string,
    videoDescription: string,
    videoUrl: string,
  ): string {
    return `
Crie um mapa mental ESTRUTURADO sobre o seguinte vídeo educacional:

Título do Vídeo: ${videoTitle}
Descrição: ${videoDescription}
URL: ${videoUrl}

CONTEXTO:
Este mapa mental será usado por estudantes preparando-se para provas e concursos.
O estudante precisa de informações CLARAS e RÁPIDAS sobre conteúdos que provavelmente serão cobrados.

Foque em:
- Conceitos principais frequentemente cobrados em provas e concursos
- Aplicações práticas
- Dicas objetivas de como o tema costuma ser cobrado
- Conexões interdisciplinares

INSTRUÇÕES:
1. Organize hierarquicamente:
   - Tema Central
   - 3-5 Tópicos Principais
   - 2-3 Subtópicos por tópico
   - Use até 3 níveis (###)
   - 2-3 pontos por seção

2. Formato Markdown:
   - # tema central
   - ## tópicos principais
   - ### subtópicos
   - - pontos-chave (informações diretas, SEM repetir o título do nó anterior)
   - NÃO use negrito ou formatação especial
   - 💡 para dicas de como os concursos costumam cobrar
   - 🔗 para conexões interdisciplinares

3. REGRA IMPORTANTE:
   - Quando um nó for um título (ex: "Floresta Amazônica"), os pontos que discorrem sobre ele NÃO devem repetir o título
   - Vá direto à informação essencial
   - Exemplo CORRETO:
     ### Floresta Amazônica
     - Maior floresta tropical do mundo
     - Biodiversidade única
   - Exemplo ERRADO:
     ### Floresta Amazônica
     - Floresta Amazônica é a maior floresta tropical
     - A Floresta Amazônica tem biodiversidade única

4. Seja OBJETIVO:
   - Frases curtas e diretas
   - Conceitos essenciais
   - Sem repetições
   - Informações rápidas para memorização

EXEMPLO:

# Biomas Brasileiros

## Floresta Amazônica
### Características
- Maior floresta tropical do mundo
- 60% no território brasileiro
- 💡 Os concursos costumam cobrar: biodiversidade e desmatamento

### Importância Ambiental
- Regulação climática global
- 🔗 Relação com aquecimento global

## Cerrado
### Características
- Savana brasileira
- Vegetação adaptada ao fogo
- 💡 Os concursos costumam cobrar: queimadas e agricultura

Gere o mapa mental:
`;
  }

  private buildTextSummaryPrompt(
    videoTitle: string,
    videoDescription: string,
    videoUrl: string,
  ): string {
    return `
Crie um RESUMO DETALHADO em texto corrido sobre o seguinte vídeo educacional:

Título do Vídeo: ${videoTitle}
Descrição: ${videoDescription}
URL: ${videoUrl}

CONTEXTO:
Este resumo será usado por estudantes preparando-se para provas e concursos.
O estudante precisa de informações CLARAS e COMPLETAS sobre o conteúdo do vídeo.

INSTRUÇÕES:
1. Estruture o resumo em seções claras com títulos
2. Use linguagem acessível e didática
3. Destaque conceitos importantes
4. Inclua exemplos práticos quando relevante
5. Mencione como os concursos costumam cobrar os temas abordados
6. Faça conexões interdisciplinares quando possível

FORMATO:
- Use markdown para formatação
- # para título principal
- ## para seções
- ### para subseções
- Use parágrafos completos e bem desenvolvidos
- Inclua listas quando apropriado para facilitar a memorização
- Use 💡 para dicas de como os concursos costumam cobrar
- Use 🔗 para conexões interdisciplinares
- Use 📌 para pontos importantes a memorizar

EXEMPLO DE ESTRUTURA:

# [Título do Tema]

## Introdução
[Parágrafo introdutório contextualizando o tema e sua importância]

## Conceitos Fundamentais
[Explicação detalhada dos conceitos principais]

### [Subtema 1]
[Explicação completa com exemplos]

💡 **Como cai nas provas:** [Explicação de como o tema é cobrado]

### [Subtema 2]
[Explicação completa com exemplos]

## Aplicações Práticas
[Como o conhecimento se aplica na prática]

## Pontos-Chave para Memorização
📌 [Lista dos pontos mais importantes]

## Conexões com Outros Temas
🔗 [Relações interdisciplinares]

Gere o resumo:
`;
  }

  /**
   * Gera questões de múltipla escolha sobre um tema usando Gemini AI
   */
  async generateQuizQuestions(topic: string): Promise<{
    questions: Array<{
      question: string;
      options: string[];
      correctOption: number;
      explanation: string;
    }>;
  }> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[Quiz] Tentativa ${attempt}/${maxRetries} - Gerando questões sobre: ${topic}`,
        );
        const prompt = this.buildQuizPrompt(topic);
        const response = await this.callGeminiAPI(prompt);
        const parsed = this.parseQuizResponse(response);
        console.log(
          `[Quiz] ✅ ${parsed.questions.length} questões geradas com sucesso`,
        );
        return parsed;
      } catch (error) {
        lastError = error;
        console.error(`[Quiz] ❌ Erro na tentativa ${attempt}:`, error);

        if (attempt < maxRetries) {
          const waitTime = attempt * 2000;
          console.log(
            `[Quiz] ⏳ Aguardando ${waitTime}ms antes de tentar novamente...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error('[Quiz] ❌ Todas as tentativas falharam');
    throw new Error(
      `Erro ao gerar questões após ${maxRetries} tentativas: ${lastError?.message || 'Erro desconhecido'}`,
    );
  }

  private buildQuizPrompt(topic: string): string {
    return `
Você é um professor especialista. Gere exatamente 10 questões de múltipla escolha sobre o tema: "${topic}"

REGRAS OBRIGATÓRIAS:
- Exatamente 10 questões
- Cada questão deve ter exatamente 4 alternativas
- correctOption deve ser um número de 1 a 4 (não índice 0-3)
- Explicação clara e educativa de 2-3 linhas
- Nível: Ensino Médio/ENEM
- Questões devem ser desafiadoras mas justas
- Alternativas incorretas devem ser plausíveis

FORMATO DE RESPOSTA - RETORNE APENAS O JSON, SEM MARKDOWN:
{
  "questions": [
    {
      "question": "Texto da pergunta aqui?",
      "options": ["Alternativa 1", "Alternativa 2", "Alternativa 3", "Alternativa 4"],
      "correctOption": 2,
      "explanation": "Explicação detalhada da resposta correta"
    }
  ]
}

IMPORTANTE:
- Retorne APENAS o JSON puro, sem \`\`\`json ou markdown
- O array "questions" deve ter EXATAMENTE 10 itens
- correctOption: número de 1 a 4
`.trim();
  }

  private parseQuizResponse(response: string): {
    questions: Array<{
      question: string;
      options: string[];
      correctOption: number;
      explanation: string;
    }>;
  } {
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanedResponse);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error(
          'Estrutura de resposta inválida - campo "questions" não encontrado',
        );
      }

      if (parsed.questions.length !== 10) {
        throw new Error(
          `IA gerou ${parsed.questions.length} questões ao invés de 10`,
        );
      }

      parsed.questions.forEach((q: any, index: number) => {
        if (!q.question || typeof q.question !== 'string') {
          throw new Error(`Questão ${index + 1} inválida: texto ausente`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(
            `Questão ${index + 1} inválida: deve ter 4 alternativas`,
          );
        }
        if (
          typeof q.correctOption !== 'number' ||
          q.correctOption < 1 ||
          q.correctOption > 4
        ) {
          throw new Error(
            `Questão ${index + 1} inválida: correctOption deve ser 1-4`,
          );
        }
        if (!q.explanation || typeof q.explanation !== 'string') {
          throw new Error(`Questão ${index + 1} inválida: explicação ausente`);
        }
      });

      return parsed;
    } catch (error) {
      console.error('Erro ao parsear resposta do Gemini:', error);
      console.error('Resposta recebida:', response);
      throw error;
    }
  }
}
