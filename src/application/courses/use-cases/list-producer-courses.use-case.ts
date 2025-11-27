import { Injectable } from '@nestjs/common';
import type { CourseRepository } from '../../../domain/repositories/course.repository';
import { Course } from '../../../domain/entities/course';

export interface ListProducerCoursesOutput {
  courses: Course[];
}

@Injectable()
export class ListProducerCoursesUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(): Promise<ListProducerCoursesOutput> {
    const courses = await this.courseRepository.findProducerCourses();
    return { courses };
  }
}

