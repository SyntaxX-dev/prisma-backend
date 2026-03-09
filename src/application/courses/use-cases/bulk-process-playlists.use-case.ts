import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import {
  GeminiService,
  PlaylistAnalysisData,
  CourseSuggestion,
} from '../../../infrastructure/services/gemini.service';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';
import { Course } from '../../../domain/entities/course';
import { SubCourse } from '../../../domain/entities/sub-course';
import { Module } from '../../../domain/entities/module';
import { Video } from '../../../domain/entities/video';

export interface BulkProcessPlaylistsInput {
  playlistIds: string[];
  aiPrompt?: string;
  courseId?: string;
}

export interface BulkProcessPlaylistsOutput {
  success: boolean;
  message: string;
  data: {
    coursesCreated: number;
    subCoursesCreated: number;
    modulesCreated: number;
    videosCreated: number;
    courses: Array<{
      courseId: string;
      courseName: string;
      subCourses: Array<{
        subCourseId: string;
        subCourseName: string;
        modules: Array<{
          moduleId: string;
          moduleName: string;
          videoCount: number;
        }>;
      }>;
    }>;
    errors?: Array<{
      playlistId: string;
      error: string;
    }>;
  };
}

@Injectable()
export class BulkProcessPlaylistsUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly subCourseRepository: SubCourseRepository,
    private readonly moduleRepository: ModuleRepository,
    private readonly videoRepository: VideoRepository,
    private readonly geminiService: GeminiService,
    private readonly youtubeService: YouTubeService,
  ) { }

  async execute(
    input: BulkProcessPlaylistsInput,
  ): Promise<BulkProcessPlaylistsOutput> {
    console.log(
      `[BulkProcess] Iniciando processamento de ${input.playlistIds.length} playlists`,
    );

    // 1. Validar curso se courseId foi fornecido
    let targetCourse: Course | null = null;
    if (input.courseId) {
      targetCourse = await this.courseRepository.findById(input.courseId);
      if (!targetCourse) {
        throw new Error(`Curso com ID ${input.courseId} não encontrado`);
      }
      console.log(`[BulkProcess] Forçando uso do curso: ${targetCourse.name}`);
    }

    // 2. Buscar lista de cursos existentes
    const existingCourses = await this.courseRepository.findAll();
    const existingCourseNames = existingCourses.map((c) => c.name);
    console.log(
      `[BulkProcess] Cursos existentes: ${existingCourseNames.join(', ')}`,
    );

    // 3. Buscar informações e vídeos de cada playlist
    const playlistData: PlaylistAnalysisData[] = [];
    const errors: Array<{ playlistId: string; error: string }> = [];

    for (const playlistId of input.playlistIds) {
      try {
        console.log(`[BulkProcess] Processando playlist: ${playlistId}`);

        // Buscar informações da playlist
        const playlistInfo =
          await this.youtubeService.getPlaylistInfo(playlistId);
        if (!playlistInfo) {
          errors.push({ playlistId, error: 'Playlist não encontrada' });
          continue;
        }

        // Buscar vídeos da playlist
        const videos = await this.youtubeService.getPlaylistVideos(
          playlistId,
          200,
        ); // Limite alto
        if (videos.length === 0) {
          errors.push({ playlistId, error: 'Playlist não contém vídeos' });
          continue;
        }

        playlistData.push({
          playlistId,
          playlistTitle: playlistInfo.title,
          playlistDescription: playlistInfo.description,
          channelName: playlistInfo.channelTitle || 'Canal Desconhecido',
          channelId: undefined, // Pode ser adicionado se necessário
          videos: videos.map((video) => ({
            videoId: video.videoId,
            title: video.title || '',
            description: video.description,
            duration: video.duration,
            tags: video.tags,
          })),
        });

        console.log(
          `[BulkProcess] Playlist ${playlistId} processada: ${videos.length} vídeos encontrados`,
        );
      } catch (error) {
        console.error(
          `[BulkProcess] Erro ao processar playlist ${playlistId}:`,
          error,
        );
        errors.push({
          playlistId,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    if (playlistData.length === 0) {
      return {
        success: false,
        message: 'Nenhuma playlist foi processada com sucesso',
        data: {
          coursesCreated: 0,
          subCoursesCreated: 0,
          modulesCreated: 0,
          videosCreated: 0,
          courses: [],
          errors,
        },
      };
    }

    // 4. Enviar para Gemini analisar e sugerir estrutura
    console.log(
      `[BulkProcess] Enviando ${playlistData.length} playlists para análise do Gemini`,
    );

    // Se tiver courseId, adicionamos ao prompt para a IA não tentar criar novos cursos
    let aiPrompt = input.aiPrompt || '';
    if (targetCourse) {
      aiPrompt = `IMPORTANTE: Todas as playlists DEVEM ser organizadas dentro do curso "${targetCourse.name}". Não crie outros cursos. ${aiPrompt}`;
    }

    const courseSuggestions =
      await this.geminiService.analyzePlaylistsForCourses(
        playlistData,
        existingCourseNames,
        aiPrompt,
      );

    console.log(
      `[BulkProcess] Gemini sugeriu ${courseSuggestions.length} cursos`,
    );

    // 4. Criar cursos, subcursos, módulos e vídeos
    const createdCourses: BulkProcessPlaylistsOutput['data']['courses'] = [];
    let totalSubCourses = 0;
    let totalModules = 0;
    let totalVideos = 0;

    // Mapa para armazenar vídeos por playlistId (para buscar depois)
    const videosByPlaylistId = new Map<
      string,
      (typeof playlistData)[0]['videos']
    >();
    playlistData.forEach((data) => {
      videosByPlaylistId.set(data.playlistId, data.videos);
    });

    for (const courseSuggestion of courseSuggestions) {
      // Se tivermos um curso alvo forçado, ignoramos a sugestão de nome da IA
      let course: Course;

      if (targetCourse) {
        course = targetCourse;
        console.log(`[BulkProcess] Respeitando curso alvo: ${course.name} (${course.id})`);
      } else {
        console.log(
          `[BulkProcess] Processando curso sugerido: ${courseSuggestion.courseName}`,
        );

        // Verificar se curso sugerido pela IA já existe
        const existingCourse = existingCourses.find(
          (c) =>
            c.name.toLowerCase().trim() ===
            courseSuggestion.courseName.toLowerCase().trim(),
        );

        if (!existingCourse) {
          // Criar novo curso
          const courseData = Course.create(
            courseSuggestion.courseName,
            `Curso de ${courseSuggestion.courseName}`,
            undefined, // Sem imagem por padrão
            false, // Não pago por padrão
          );
          course = await this.courseRepository.create(courseData);
          console.log(
            `[BulkProcess] Novo curso criado: ${course.name} (${course.id})`,
          );
        } else {
          course = existingCourse;
          console.log(
            `[BulkProcess] Usando curso existente: ${course.name} (${course.id})`,
          );
        }
      }

      const courseOutput: (typeof createdCourses)[0] = {
        courseId: course.id,
        courseName: course.name,
        subCourses: [],
      };

      // Criar subcursos
      for (const subCourseSuggestion of courseSuggestion.subCourses) {
        console.log(
          `[BulkProcess] Processando subcurso: ${subCourseSuggestion.subCourseName}`,
        );

        // Buscar vídeos da playlist correspondente
        const playlistVideos = videosByPlaylistId.get(
          subCourseSuggestion.playlistId,
        );
        if (!playlistVideos || playlistVideos.length === 0) {
          console.warn(
            `[BulkProcess] Vídeos não encontrados para playlist ${subCourseSuggestion.playlistId}`,
          );
          continue;
        }

        // Buscar vídeos completos do YouTube
        const fullVideos = await this.youtubeService.getPlaylistVideos(
          subCourseSuggestion.playlistId,
          200,
        );

        // Buscar subcursos existentes para calcular ordem
        const existingSubCourses =
          await this.subCourseRepository.findByCourseId(course.id);
        const nextOrder = existingSubCourses.length;

        // Criar subcurso com tratamento de erro
        let subCourse: SubCourse;
        try {
          const subCourseData = SubCourse.create(
            course.id,
            subCourseSuggestion.subCourseName,
            undefined, // Sem descrição por padrão
            nextOrder,
          );
          subCourse = await this.subCourseRepository.create(subCourseData);
          totalSubCourses++;
          console.log(
            `[BulkProcess] Subcurso criado: ${subCourse.name} (${subCourse.id})`,
          );
        } catch (error) {
          console.error(`[BulkProcess] Erro ao criar subcurso ${subCourseSuggestion.subCourseName}:`, error);
          errors.push({ playlistId: subCourseSuggestion.playlistId, error: `Erro ao criar subcurso: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
          continue;
        }

        const subCourseOutput = {
          subCourseId: subCourse.id,
          subCourseName: subCourse.name,
          modules: [] as Array<{
            moduleId: string;
            moduleName: string;
            videoCount: number;
          }>,
        };

        // Criar módulos e vídeos
        let moduleOrder = 0;
        for (const moduleSuggestion of subCourseSuggestion.modules) {
          // Criar módulo com tratamento de erro
          let module: Module;
          try {
            const moduleData = Module.create(
              subCourse.id,
              moduleSuggestion.name,
              moduleSuggestion.description,
              moduleOrder,
            );
            module = await this.moduleRepository.create(moduleData);
            totalModules++;
            moduleOrder++;
            console.log(`[BulkProcess] Módulo criado: ${module.name} (${module.id})`);
          } catch (error) {
            console.error(`[BulkProcess] Erro ao criar módulo ${moduleSuggestion.name}:`, error);
            continue;
          }

          // Criar vídeos do módulo
          let videoOrder = 0;
          for (const videoIndex of moduleSuggestion.videoIndices) {
            if (videoIndex >= fullVideos.length) {
              console.warn(
                `[BulkProcess] Índice de vídeo ${videoIndex} fora do range`,
              );
              continue;
            }

            const youtubeVideo = fullVideos[videoIndex];

            // Truncar descrição para evitar erro de banco de dados (max 2500)
            const truncatedDescription = youtubeVideo.description
              ? youtubeVideo.description.substring(0, 2500)
              : undefined;

            // Validar data
            let publishedAt: Date | undefined = undefined;
            if (youtubeVideo.publishedAt) {
              const date = new Date(youtubeVideo.publishedAt);
              if (!isNaN(date.getTime())) {
                publishedAt = date;
              }
            }

            try {
              const videoData = Video.create(
                module.id,
                subCourse.id,
                youtubeVideo.videoId,
                youtubeVideo.title || 'Sem título',
                youtubeVideo.url,
                truncatedDescription,
                youtubeVideo.thumbnailUrl,
                youtubeVideo.duration || 0,
                youtubeVideo.channelTitle,
                youtubeVideo.channelId,
                youtubeVideo.channelThumbnailUrl,
                publishedAt,
                youtubeVideo.viewCount,
                youtubeVideo.tags,
                youtubeVideo.category,
                videoOrder,
              );
              await this.videoRepository.create(videoData);
              totalVideos++;
              videoOrder++;
            } catch (error) {
              console.error(`[BulkProcess] Erro ao salvar vídeo ${youtubeVideo.videoId}:`, error);
              // Continuamos para o próximo vídeo
            }
          }

          subCourseOutput.modules.push({
            moduleId: module.id,
            moduleName: module.name,
            videoCount: moduleSuggestion.videoIndices.length,
          });
        }

        courseOutput.subCourses.push(subCourseOutput);
      }

      createdCourses.push(courseOutput);
    }

    const message = `Processamento concluído! Criados ${courseSuggestions.length} curso(s), ${totalSubCourses} subcurso(s), ${totalModules} módulo(s) e ${totalVideos} vídeo(s).`;

    return {
      success: true,
      message,
      data: {
        coursesCreated: courseSuggestions.length,
        subCoursesCreated: totalSubCourses,
        modulesCreated: totalModules,
        videosCreated: totalVideos,
        courses: createdCourses,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }
}
