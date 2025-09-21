import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';

export interface DeleteModuleInput {
  moduleId: string;
}

export interface DeleteModuleOutput {
  success: boolean;
}

@Injectable()
export class DeleteModuleUseCase {
  constructor(private readonly moduleRepository: ModuleRepository) {}

  async execute(input: DeleteModuleInput): Promise<DeleteModuleOutput> {
    // Verificar se o módulo existe
    const existingModule = await this.moduleRepository.findById(input.moduleId);
    if (!existingModule) {
      throw new Error(`Módulo com ID "${input.moduleId}" não encontrado`);
    }

    await this.moduleRepository.delete(input.moduleId);

    return { success: true };
  }
}
