import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import { SubCourse } from '../../../domain/entities/sub-course';

export interface CreateSubCourseInput {
  courseId: string;
  name: string;
  description?: string;
  order?: number;
}

export interface CreateSubCourseOutput {
  subCourse: SubCourse;
}

@Injectable()
export class CreateSubCourseUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly subCourseRepository: SubCourseRepository,
  ) {}

  async execute(input: CreateSubCourseInput): Promise<CreateSubCourseOutput> {
    // Verificar se o curso existe
    const course = await this.courseRepository.findById(input.courseId);
    if (!course) {
      throw new Error(`Curso com ID "${input.courseId}" não encontrado`);
    }

    const subCourseData = SubCourse.create(
      input.courseId,
      input.name,
      input.description,
      input.order,
    );
    const subCourse = await this.subCourseRepository.create(subCourseData);

    return { subCourse };
  }
}
