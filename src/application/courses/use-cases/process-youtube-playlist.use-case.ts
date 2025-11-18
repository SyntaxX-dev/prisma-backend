import { Injectable, NotFoundException } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { GeminiService } from '../../../infrastructure/services/gemini.service';

export interface ProcessYouTubePlaylistInput {
  courseId: string;
  subCourseName: string;
  subCourseDescription?: string;
  aiPrompt?: string;
  videos: Array<{
    videoId: string;
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    duration?: number;
    channelTitle?: string;
    channelId?: string;
    channelThumbnailUrl?: string;
    publishedAt?: string;
    viewCount?: number;
    tags?: string[];
    category?: string;
  }>;
}

export interface ProcessYouTubePlaylistOutput {
  success: boolean;
  message: string;
  data: {
    subCourse: {
      id: string;
      name: string;
      description?: string;
    };
    modules: Array<{
      id: string;
      name: string;
      description?: string;
      order: number;
      videoCount: number;
      videos: Array<{
        id: string;
        videoId: string;
        title: string;
        order: number;
      }>;
    }>;
  };
}

@Injectable()
export class ProcessYouTubePlaylistUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly subCourseRepository: SubCourseRepository,
    private readonly moduleRepository: ModuleRepository,
    private readonly videoRepository: VideoRepository,
    private readonly geminiService: GeminiService,
  ) {}

  async execute(
    input: ProcessYouTubePlaylistInput,
  ): Promise<ProcessYouTubePlaylistOutput> {
    // Verificar se o curso existe
    const course = await this.courseRepository.findById(input.courseId);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    // Criar o subcurso
    const subCourse = await this.subCourseRepository.create({
      courseId: input.courseId,
      name: input.subCourseName,
      description: input.subCourseDescription || null,
      order: 0, // Será calculado automaticamente
    });

    // Organizar vídeos em módulos usando IA (Gemini)
    const moduleSuggestions =
      await this.geminiService.organizeVideosIntoModules(
        input.videos.map((video) => ({
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          duration: video.duration,
          tags: video.tags,
        })),
        input.aiPrompt,
      );

    const createdModules: Array<{
      id: string;
      name: string;
      description?: string;
      order: number;
      videoCount: number;
      videos: Array<{
        id: string;
        videoId: string;
        title: string;
        order: number;
      }>;
    }> = [];
    let moduleOrder = 0;

    for (const moduleSuggestion of moduleSuggestions) {
      // Criar módulo
      const module = await this.moduleRepository.create({
        subCourseId: subCourse.id,
        name: moduleSuggestion.name,
        description: moduleSuggestion.description,
        order: moduleOrder++,
      });

      // Criar vídeos do módulo
      const createdVideos: Array<{
        id: string;
        videoId: string;
        title: string;
        order: number;
      }> = [];
      let videoOrder = 0;

      for (const videoIndex of moduleSuggestion.videoIndices) {
        const videoData = input.videos[videoIndex];
        const video = await this.videoRepository.create({
          moduleId: module.id,
          subCourseId: subCourse.id,
          videoId: videoData.videoId,
          title: videoData.title,
          description: videoData.description || null,
          url: videoData.url,
          thumbnailUrl: videoData.thumbnailUrl || null,
          duration: this.parseNumericValue(videoData.duration),
          channelTitle: videoData.channelTitle || null,
          channelId: videoData.channelId || null,
          channelThumbnailUrl: videoData.channelThumbnailUrl || null,
          publishedAt: videoData.publishedAt
            ? new Date(videoData.publishedAt)
            : null,
          viewCount: this.parseNumericValue(videoData.viewCount),
          tags: Array.isArray(videoData.tags) ? videoData.tags : null,
          category: videoData.category || null,
          order: videoOrder++,
        });

        createdVideos.push({
          id: video.id,
          videoId: video.videoId,
          title: video.title,
          order: video.order,
        });
      }

      // Atualizar contagem de vídeos do módulo
      await this.moduleRepository.updateVideoCount(
        module.id,
        createdVideos.length,
      );

      createdModules.push({
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        order: module.order,
        videoCount: createdVideos.length,
        videos: createdVideos,
      });
    }

    return {
      success: true,
      message: `Playlist processada com sucesso! Criados ${createdModules.length} módulos com ${input.videos.length} vídeos.`,
      data: {
        subCourse: {
          id: subCourse.id,
          name: subCourse.name,
          description: subCourse.description || undefined,
        },
        modules: createdModules,
      },
    };
  }

  private organizeVideosIntoModules(
    videos: ProcessYouTubePlaylistInput['videos'],
  ) {
    const modules: Array<{
      name: string;
      description: string;
      videos: ProcessYouTubePlaylistInput['videos'];
    }> = [];
    let currentModule: string | null = null;
    let currentModuleVideos: ProcessYouTubePlaylistInput['videos'] = [];
    let moduleCounter = 1;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const nextVideo = videos[i + 1];

      // Detectar início de novo módulo baseado em padrões no título
      const isNewModule = this.detectNewModule(video, nextVideo, i);

      if (isNewModule && currentModuleVideos.length > 0) {
        // Finalizar módulo atual
        modules.push({
          name: currentModule || `Módulo ${moduleCounter}`,
          description: `Conteúdo do ${currentModule || `Módulo ${moduleCounter}`}`,
          videos: [...currentModuleVideos],
        });
        moduleCounter++;
        currentModuleVideos = [];
        currentModule = null;
      }

      // Adicionar vídeo ao módulo atual
      currentModuleVideos.push(video);

      // Detectar nome do módulo baseado no título do primeiro vídeo
      if (currentModuleVideos.length === 1) {
        currentModule = this.extractModuleName(video.title);
      }
    }

    // Adicionar último módulo se houver vídeos
    if (currentModuleVideos.length > 0) {
      modules.push({
        name: currentModule || `Módulo ${moduleCounter}`,
        description: `Conteúdo do ${currentModule || `Módulo ${moduleCounter}`}`,
        videos: currentModuleVideos,
      });
    }

    return modules;
  }

  private detectNewModule(
    currentVideo: ProcessYouTubePlaylistInput['videos'][0],
    nextVideo: ProcessYouTubePlaylistInput['videos'][0] | undefined,
    index: number,
  ): boolean {
    // Se é o primeiro vídeo, não é novo módulo
    if (index === 0) return false;

    // Se não há próximo vídeo, não é novo módulo
    if (!nextVideo) return false;

    const currentTitle = currentVideo.title.toLowerCase();
    const nextTitle = nextVideo.title.toLowerCase();

    // Detectar padrões que indicam novo módulo
    const newModulePatterns = [
      // Números sequenciais que pulam muito (ex: #01, #15)
      () => {
        const currentNum = this.extractVideoNumber(currentTitle);
        const nextNum = this.extractVideoNumber(nextTitle);
        return currentNum && nextNum && nextNum - currentNum > 5;
      },
      // Mudança de tema baseada em palavras-chave
      () => {
        const currentKeywords = this.extractKeywords(currentTitle);
        const nextKeywords = this.extractKeywords(nextTitle);
        return this.hasSignificantTopicChange(currentKeywords, nextKeywords);
      },
      // Padrões específicos de cursos (ex: "Curso React: Introdução" vs "Curso React: Instalando")
      () => {
        const currentTopic = this.extractTopicFromTitle(currentTitle);
        const nextTopic = this.extractTopicFromTitle(nextTitle);
        return currentTopic && nextTopic && currentTopic !== nextTopic;
      },
    ];

    return newModulePatterns.some((pattern) => pattern());
  }

  private extractVideoNumber(title: string): number | null {
    const match = title.match(/#(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  private extractKeywords(title: string): string[] {
    // Palavras-chave comuns em cursos de programação
    const keywords = [
      'introdução',
      'introducao',
      'introduction',
      'instalando',
      'instalacao',
      'installation',
      'setup',
      'componentes',
      'components',
      'props',
      'state',
      'hooks',
      'router',
      'navegação',
      'navigation',
      'formulario',
      'form',
      'forms',
      'api',
      'backend',
      'database',
      'projeto',
      'project',
      'aplicação',
      'application',
      'css',
      'styling',
      'estilo',
      'eventos',
      'events',
      'listas',
      'lists',
      'arrays',
      'condicional',
      'conditional',
      'crud',
      'create',
      'read',
      'update',
      'delete',
    ];

    return keywords.filter((keyword) => title.includes(keyword));
  }

  private hasSignificantTopicChange(
    currentKeywords: string[],
    nextKeywords: string[],
  ): boolean {
    // Se não há palavras-chave em comum, pode ser novo módulo
    const commonKeywords = currentKeywords.filter((keyword) =>
      nextKeywords.includes(keyword),
    );

    return (
      commonKeywords.length === 0 &&
      (currentKeywords.length > 0 || nextKeywords.length > 0)
    );
  }

  private extractTopicFromTitle(title: string): string | null {
    // Extrair tópico principal do título
    const patterns = [
      /curso\s+\w+:\s*([^#-]+)/i, // "Curso React: Introdução"
      /#\d+\s*-\s*([^#-]+)/i, // "#01 - Introdução"
      /^([^#-]+?)(?:\s*#|\s*-)/i, // "Introdução #01"
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1].trim().toLowerCase();
      }
    }

    return null;
  }

  private extractModuleName(title: string): string {
    // Extrair nome do módulo do título
    const patterns = [
      /curso\s+\w+:\s*([^#-]+)/i, // "Curso React: Introdução"
      /#\d+\s*-\s*([^#-]+)/i, // "#01 - Introdução"
      /^([^#-]+?)(?:\s*#|\s*-)/i, // "Introdução #01"
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Se não conseguir extrair, usar parte do título
    const cleanTitle = title
      .replace(/#\d+/g, '')
      .replace(/^[^a-zA-Z]*/, '')
      .trim();
    return cleanTitle.length > 50
      ? cleanTitle.substring(0, 50) + '...'
      : cleanTitle;
  }

  private parseNumericValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return null;
    }

    return num;
  }
}
