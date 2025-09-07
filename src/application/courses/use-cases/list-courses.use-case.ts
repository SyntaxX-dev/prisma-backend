import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import { Course } from '../../../domain/entities/course';

export interface ListCoursesOutput {
  courses: Course[];
}

@Injectable()
export class ListCoursesUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(): Promise<ListCoursesOutput> {
    const courses = await this.courseRepository.findAll();
    return { courses };
  }
}
