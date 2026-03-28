import { Injectable } from '@nestjs/common';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';

export interface DeleteSubCourseInput {
  id: string;
}

@Injectable()
export class DeleteSubCourseUseCase {
  constructor(private readonly subCourseRepository: SubCourseRepository) { }

  async execute(input: DeleteSubCourseInput): Promise<void> {
    const subCourse = await this.subCourseRepository.findById(input.id);
    if (!subCourse) {
      throw new Error(`Subcurso com ID ${input.id} não encontrado`);
    }

    await this.subCourseRepository.delete(input.id);
  }
}
