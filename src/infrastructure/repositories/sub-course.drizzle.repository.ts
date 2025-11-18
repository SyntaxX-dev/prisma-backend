import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SubCourseRepository } from '../../domain/repositories/sub-course.repository';
import { SubCourse } from '../../domain/entities/sub-course';
import { DrizzleService } from '../config/providers/drizzle.service';
import { subCourses, videos } from '../database/schema';

@Injectable()
export class SubCourseDrizzleRepository implements SubCourseRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(
    subCourse: Omit<SubCourse, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SubCourse> {
    const [created] = await this.drizzleService.db
      .insert(subCourses)
      .values({
        courseId: subCourse.courseId,
        name: subCourse.name,
        description: subCourse.description,
        order: subCourse.order,
      })
      .returning();

    return new SubCourse(
      created.id,
      created.courseId,
      created.name,
      created.description,
      created.order,
      created.createdAt,
      created.updatedAt,
    );
  }

  async findById(id: string): Promise<SubCourse | null> {
    const [subCourse] = await this.drizzleService.db
      .select()
      .from(subCourses)
      .where(eq(subCourses.id, id));

    if (!subCourse) return null;

    return new SubCourse(
      subCourse.id,
      subCourse.courseId,
      subCourse.name,
      subCourse.description,
      subCourse.order,
      subCourse.createdAt,
      subCourse.updatedAt,
    );
  }

  async findByCourseId(courseId: string): Promise<SubCourse[]> {
    const subCoursesList = await this.drizzleService.db
      .select()
      .from(subCourses)
      .where(eq(subCourses.courseId, courseId))
      .orderBy(subCourses.order, subCourses.createdAt);

    return subCoursesList.map(
      (subCourse) =>
        new SubCourse(
          subCourse.id,
          subCourse.courseId,
          subCourse.name,
          subCourse.description,
          subCourse.order,
          subCourse.createdAt,
          subCourse.updatedAt,
        ),
    );
  }

  async findByCourseIdWithChannelInfo(courseId: string): Promise<SubCourse[]> {
    const subCoursesList = await this.drizzleService.db
      .select()
      .from(subCourses)
      .where(eq(subCourses.courseId, courseId))
      .orderBy(subCourses.order, subCourses.createdAt);

    // Para cada sub-course, buscar o primeiro vídeo para obter informações do canal
    const subCoursesWithChannelInfo = await Promise.all(
      subCoursesList.map(async (subCourse) => {
        // Buscar o primeiro vídeo do sub-course para obter informações do canal
        const [firstVideo] = await this.drizzleService.db
          .select({
            channelThumbnailUrl: videos.channelThumbnailUrl,
          })
          .from(videos)
          .where(eq(videos.subCourseId, subCourse.id))
          .limit(1);

        return new SubCourse(
          subCourse.id,
          subCourse.courseId,
          subCourse.name,
          subCourse.description,
          subCourse.order,
          subCourse.createdAt,
          subCourse.updatedAt,
          firstVideo?.channelThumbnailUrl || null,
        );
      }),
    );

    return subCoursesWithChannelInfo;
  }

  async findAll(): Promise<SubCourse[]> {
    const subCoursesList = await this.drizzleService.db
      .select()
      .from(subCourses)
      .orderBy(subCourses.order, subCourses.createdAt);

    return subCoursesList.map(
      (subCourse) =>
        new SubCourse(
          subCourse.id,
          subCourse.courseId,
          subCourse.name,
          subCourse.description,
          subCourse.order,
          subCourse.createdAt,
          subCourse.updatedAt,
        ),
    );
  }

  async update(
    id: string,
    subCourse: Partial<Omit<SubCourse, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<SubCourse> {
    const [updated] = await this.drizzleService.db
      .update(subCourses)
      .set({
        courseId: subCourse.courseId,
        name: subCourse.name,
        description: subCourse.description,
        order: subCourse.order,
        updatedAt: new Date(),
      })
      .where(eq(subCourses.id, id))
      .returning();

    return new SubCourse(
      updated.id,
      updated.courseId,
      updated.name,
      updated.description,
      updated.order,
      updated.createdAt,
      updated.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(subCourses)
      .where(eq(subCourses.id, id));
  }
}
