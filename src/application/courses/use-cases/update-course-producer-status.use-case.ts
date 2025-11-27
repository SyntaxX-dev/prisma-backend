import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import { Course } from '../../../domain/entities/course';

export interface UpdateCourseProducerStatusInput {
  courseId: string;
  isProducerCourse: boolean;
}

export interface UpdateCourseProducerStatusOutput {
  course: Course;
}

@Injectable()
export class UpdateCourseProducerStatusUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    input: UpdateCourseProducerStatusInput,
  ): Promise<UpdateCourseProducerStatusOutput> {
    const existingCourse = await this.courseRepository.findById(input.courseId);
    if (!existingCourse) {
      throw new Error(`Curso com ID "${input.courseId}" não encontrado`);
    }

    const updatedCourse = await this.courseRepository.update(input.courseId, {
      isProducerCourse: input.isProducerCourse,
    });

    return { course: updatedCourse };
  }
}

