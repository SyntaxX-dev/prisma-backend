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
import { YouTubeVideoDto } from '../../../presentation/http/dtos/youtube-video.dto';



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
    const playlistData: Array<{
      playlistId: string;
      playlistTitle: string;
      playlistDescription?: string;
      channelName: string;
      channelId?: string;
      videos: YouTubeVideoDto[];
    }> = [];
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
          videos: videos, // Guardamos o DTO completo aqui
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

    const geminiInput: PlaylistAnalysisData[] = playlistData.map((data) => ({
      playlistId: data.playlistId,
      playlistTitle: data.playlistTitle,
      playlistDescription: data.playlistDescription,
      channelName: data.channelName,
      channelId: data.channelId,
      videos: data.videos.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        description: v.description,
        duration: v.duration,
        tags: v.tags,
      })),
    }));

    const courseSuggestions =
      await this.geminiService.analyzePlaylistsForCourses(
        geminiInput,
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

    const videosByPlaylistId = new Map<string, YouTubeVideoDto[]>();
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

        // 1. Verificar se o subcurso já existe para esta playlist neste curso
        let subCourse: SubCourse | null = null;
        try {
          subCourse = await this.subCourseRepository.findByPlaylistId(
            course.id,
            subCourseSuggestion.playlistId,
          );
        } catch (error) {
          console.error(`[BulkProcess] Erro ao buscar subcurso existente:`, error);
        }

        if (subCourse) {
          console.log(
            `[BulkProcess] Subcurso já existe para a playlist ${subCourseSuggestion.playlistId}: ${subCourse.name} (${subCourse.id}). Pulando criação...`,
          );
        } else {
          // Buscar vídeos da playlist correspondente (já carregados no início)
          const playlistVideos = videosByPlaylistId.get(
            subCourseSuggestion.playlistId,
          );
          if (!playlistVideos || playlistVideos.length === 0) {
            console.warn(
              `[BulkProcess] Vídeos não encontrados para playlist ${subCourseSuggestion.playlistId}`,
            );
            continue;
          }

          // Buscar subcursos existentes para calcular ordem
          const existingSubCourses =
            await this.subCourseRepository.findByCourseId(course.id);
          const nextOrder = existingSubCourses.length;

          // Criar subcurso com tratamento de erro
          try {
            const subCourseData = SubCourse.create(
              course.id,
              subCourseSuggestion.subCourseName,
              undefined, // Sem descrição por padrão
              subCourseSuggestion.playlistId,
              nextOrder,
            );
            subCourse = await this.subCourseRepository.create(subCourseData);
            totalSubCourses++;
            console.log(
              `[BulkProcess] Subcurso criado: ${subCourse.name} (${subCourse.id})`,
            );

            // Criar módulos e vídeos (Mover para dentro do bloco try)
            const subCourseOutput = {
              subCourseId: subCourse.id,
              subCourseName: subCourse.name,
              modules: [] as Array<{
                moduleId: string;
                moduleName: string;
                videoCount: number;
              }>,
            };

            let moduleOrder = 0;
            for (const moduleSuggestion of subCourseSuggestion.modules) {
              const moduleData = Module.create(
                subCourse.id,
                moduleSuggestion.name,
                moduleSuggestion.description,
                moduleOrder,
              );
              const module = await this.moduleRepository.create(moduleData);
              totalModules++;
              moduleOrder++;

              let videoOrder = 0;
              for (const videoIndex of moduleSuggestion.videoIndices) {
                if (videoIndex >= playlistVideos.length) continue;

                const youtubeVideo = playlistVideos[videoIndex];
                const truncatedDescription = youtubeVideo.description
                  ? youtubeVideo.description.substring(0, 2500)
                  : undefined;

                let publishedAt: Date | undefined = undefined;
                if (youtubeVideo.publishedAt) {
                  const date = new Date(youtubeVideo.publishedAt);
                  if (!isNaN(date.getTime())) publishedAt = date;
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
                } catch (vError) {
                  console.error(`[BulkProcess] Erro ao salvar vídeo:`, vError);
                }
              }

              subCourseOutput.modules.push({
                moduleId: module.id,
                moduleName: module.name,
                videoCount: moduleSuggestion.videoIndices.length,
              });
            }
            courseOutput.subCourses.push(subCourseOutput);

          } catch (error) {
            console.error(
              `[BulkProcess] Erro ao processar subcurso ${subCourseSuggestion.subCourseName}:`,
              error,
            );
            errors.push({
              playlistId: subCourseSuggestion.playlistId,
              error: `Erro ao processar subcurso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            });
            continue;
          }
        }
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
