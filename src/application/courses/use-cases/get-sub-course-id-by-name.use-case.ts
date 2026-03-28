import { Injectable } from '@nestjs/common';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';

export interface GetSubCourseIdByNameInput {
  name: string;
}

@Injectable()
export class GetSubCourseIdByNameUseCase {
  constructor(private readonly subCourseRepository: SubCourseRepository) { }

  async execute(input: GetSubCourseIdByNameInput): Promise<{ id: string } | null> {
    const subCourse = await this.subCourseRepository.findByName(input.name);
    if (!subCourse) return null;

    return { id: subCourse.id };
  }
}
