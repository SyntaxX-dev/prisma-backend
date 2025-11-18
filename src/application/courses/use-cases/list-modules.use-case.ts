import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import { Module } from '../../../domain/entities/module';

export interface ListModulesInput {
  subCourseId: string;
}

export interface ListModulesOutput {
  modules: Module[];
}

@Injectable()
export class ListModulesUseCase {
  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly subCourseRepository: SubCourseRepository,
  ) {}

  async execute(input: ListModulesInput): Promise<ListModulesOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(
      input.subCourseId,
    );
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    const modules = await this.moduleRepository.findBySubCourseId(
      input.subCourseId,
    );

    return { modules };
  }
}
