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
      console.warn('GEMINI_API_KEY não configurada. Usando algoritmo local como fallback.');
    }
  }

  async organizeVideosIntoModules(
    videos: VideoData[],
    customPrompt?: string
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
${videos.map((video, index) => 
  `${index}: "${video.title}"`
).join('\n')}

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
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
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
    
    if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
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
      console.log('Resposta parseada do Gemini:', JSON.stringify(parsed, null, 2));
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
        videoIndices: moduleVideos.map((_, index) => i + index)
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
    customPrompt?: string
  ): Promise<CourseSuggestion[]> {
    if (!this.apiKey) {
      return this.fallbackCourseSuggestion(playlists);
    }

    try {
      const prompt = this.buildCourseAnalysisPrompt(playlists, existingCourseNames, customPrompt);
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
    customPrompt?: string
  ): string {
    const existingCoursesList = existingCourseNames.length > 0 
      ? `\n\nCURSOS JÁ EXISTENTES (não criar duplicatas):\n${existingCourseNames.join(', ')}`
      : '\n\nNenhum curso existe ainda.';

    const playlistsData = playlists.map((playlist, idx) => {
      const videosList = playlist.videos.map((v, vidx) => `${vidx}: "${v.title}"`).join('\n');
      return `
PLAYLIST ${idx + 1}:
- ID: ${playlist.playlistId}
- Título: ${playlist.playlistTitle}
- Canal: ${playlist.channelName}
- Descrição: ${playlist.playlistDescription || 'N/A'}
- Vídeos (${playlist.videos.length}):
${videosList}
`;
    }).join('\n---\n');

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
    playlists: PlaylistAnalysisData[]
  ): CourseSuggestion[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Resposta parseada do Gemini (cursos):', JSON.stringify(parsed, null, 2));

      if (!parsed.courses || !Array.isArray(parsed.courses)) {
        throw new Error('Estrutura de resposta inválida - campo "courses" não encontrado');
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

      const allPlaylistIds = new Set(playlists.map(p => p.playlistId));
      const missing = Array.from(allPlaylistIds).filter(id => !processedPlaylistIds.has(id));
      
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

  private fallbackCourseSuggestion(playlists: PlaylistAnalysisData[]): CourseSuggestion[] {
    // Algoritmo fallback: uma playlist = um subcurso, organiza por nome do canal
    const coursesMap = new Map<string, CourseSuggestion>();

    playlists.forEach((playlist) => {
      // Extrair tema geral do título (primeira palavra ou tema principal)
      const courseName = this.extractCourseNameFromPlaylist(playlist.playlistTitle);
      
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
          videoIndices: playlist.videos.slice(i, i + videosPerModule).map((_, idx) => i + idx),
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
      'biologia': 'Biologia',
      'matemática': 'Matemática',
      'português': 'Português',
      'portugues': 'Português',
      'react': 'React',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'node': 'Node.js',
      'python': 'Python',
      'java': 'Java',
      'teologia': 'Teologia',
      'história': 'História',
      'historia': 'História',
      'geografia': 'Geografia',
      'física': 'Física',
      'fisica': 'Física',
      'química': 'Química',
      'quimica': 'Química',
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
   * Gera um mapa mental detalhado sobre um vídeo usando Gemini AI
   */
  async generateMindMap(
    videoTitle: string,
    videoDescription: string,
    videoUrl: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    try {
      const prompt = this.buildMindMapPrompt(videoTitle, videoDescription, videoUrl);
      const response = await this.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error('Erro ao gerar mapa mental:', error);
      throw error;
    }
  }

  private buildMindMapPrompt(
    videoTitle: string,
    videoDescription: string,
    videoUrl: string
  ): string {
    return `
Crie um mapa mental detalhado e estruturado sobre o seguinte vídeo educacional do YouTube:

**Título do Vídeo:** ${videoTitle}
**Descrição:** ${videoDescription}
**URL:** ${videoUrl}

**INSTRUÇÕES:**
1. Analise o título e a descrição do vídeo para entender o conteúdo
2. Organize o mapa mental em formato hierárquico com:
   - Tema Central (baseado no título do vídeo)
   - 3-5 Tópicos Principais
   - 2-4 Subtópicos para cada tópico principal
   - Pontos-chave e conceitos importantes

3. Formate a resposta em **Markdown** com estrutura clara:
   - # para o tema central
   - ## para tópicos principais
   - ### para subtópicos
   - - para pontos-chave
   - **negrito** para conceitos importantes

4. Mantenha o conteúdo:
   - Conciso e direto
   - Educativo e bem organizado
   - Focado nos principais conceitos
   - Em português brasileiro

**EXEMPLO DE FORMATO:**

# Tema Central do Vídeo

## Tópico Principal 1
### Subtópico 1.1
- Ponto-chave importante
- Outro conceito **relevante**

### Subtópico 1.2
- Informação adicional
- Detalhes importantes

## Tópico Principal 2
### Subtópico 2.1
- Conceito fundamental
- Aplicação prática

Gere agora o mapa mental seguindo exatamente este formato:
`;
  }
}
