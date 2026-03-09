import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import { SubCourse } from '../../../domain/entities/sub-course';

export interface ListSubCoursesInput {
  courseId: string;
  limit?: number;
  offset?: number;
}

export interface ListSubCoursesOutput {
  subCourses: SubCourse[];
}

@Injectable()
export class ListSubCoursesUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly subCourseRepository: SubCourseRepository,
  ) { }

  async execute(input: ListSubCoursesInput): Promise<ListSubCoursesOutput> {
    // Verificar se o curso existe
    const course = await this.courseRepository.findById(input.courseId);
    if (!course) {
      throw new Error(`Curso com ID "${input.courseId}" não encontrado`);
    }

    const subCourses =
      await this.subCourseRepository.findByCourseIdWithChannelInfo(
        input.courseId,
        input.limit,
        input.offset,
      );
    return { subCourses };
  }
}
