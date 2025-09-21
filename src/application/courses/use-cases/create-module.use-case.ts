import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import { Module } from '../../../domain/entities/module';

export interface CreateModuleInput {
  subCourseId: string;
  name: string;
  description?: string;
  order?: number;
}

export interface CreateModuleOutput {
  module: Module;
}

@Injectable()
export class CreateModuleUseCase {
  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly subCourseRepository: SubCourseRepository,
  ) {}

  async execute(input: CreateModuleInput): Promise<CreateModuleOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(input.subCourseId);
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    const moduleData = Module.create(
      input.subCourseId,
      input.name,
      input.description,
      input.order || 0,
    );
    const module = await this.moduleRepository.create(moduleData);

    return { module };
  }
}
