import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import { Module } from '../../../domain/entities/module';

export interface UpdateModuleInput {
  moduleId: string;
  name?: string;
  description?: string;
  order?: number;
}

export interface UpdateModuleOutput {
  module: Module;
}

@Injectable()
export class UpdateModuleUseCase {
  constructor(private readonly moduleRepository: ModuleRepository) {}

  async execute(input: UpdateModuleInput): Promise<UpdateModuleOutput> {
    // Verificar se o módulo existe
    const existingModule = await this.moduleRepository.findById(input.moduleId);
    if (!existingModule) {
      throw new Error(`Módulo com ID "${input.moduleId}" não encontrado`);
    }

    const updatedModule = await this.moduleRepository.update(input.moduleId, {
      name: input.name,
      description: input.description,
      order: input.order,
    });

    return { module: updatedModule };
  }
}
