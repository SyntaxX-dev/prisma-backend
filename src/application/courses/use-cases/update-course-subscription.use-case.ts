import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import { Course } from '../../../domain/entities/course';

export interface UpdateCourseSubscriptionInput {
  courseId: string;
  isPaid: boolean;
}

export interface UpdateCourseSubscriptionOutput {
  course: Course;
}

@Injectable()
export class UpdateCourseSubscriptionUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    input: UpdateCourseSubscriptionInput,
  ): Promise<UpdateCourseSubscriptionOutput> {
    // Verificar se o curso existe
    const existingCourse = await this.courseRepository.findById(input.courseId);
    if (!existingCourse) {
      throw new Error(`Curso com ID "${input.courseId}" não encontrado`);
    }

    // Atualizar apenas o campo isPaid
    const updatedCourse = await this.courseRepository.update(input.courseId, {
      isPaid: input.isPaid,
    });

    return { course: updatedCourse };
  }
}
