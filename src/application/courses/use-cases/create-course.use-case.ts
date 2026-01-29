import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import { Course } from '../../../domain/entities/course';

export interface CreateCourseInput {
  name: string;
  description?: string;
  imageUrl?: string;
  isPaid?: boolean;
  isProducerCourse?: boolean;
}

export interface CreateCourseOutput {
  course: Course;
}

@Injectable()
export class CreateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(input: CreateCourseInput): Promise<CreateCourseOutput> {
    // Verificar se já existe um curso com o mesmo nome
    const existingCourse = await this.courseRepository.findByName(input.name);
    if (existingCourse) {
      throw new Error(`Curso com o nome "${input.name}" já existe`);
    }

    const courseData = Course.create(
      input.name,
      input.description,
      input.imageUrl,
      input.isPaid,
      input.isProducerCourse,
    );
    const course = await this.courseRepository.create(courseData);

    return { course };
  }
}
