import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  BLOCK_REPOSITORY,
} from '../../../domain/tokens';
import type { BlockRepository } from '../../../domain/repositories/block.repository';

export interface UnblockUserInput {
  blockerId: string; // Usuário que está desbloqueando
  blockedId: string; // Usuário que será desbloqueado
}

export interface UnblockUserOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class UnblockUserUseCase {
  constructor(
    @Inject(BLOCK_REPOSITORY)
    private readonly blockRepository: BlockRepository,
  ) {}

  async execute(input: UnblockUserInput): Promise<UnblockUserOutput> {
    const { blockerId, blockedId } = input;

    // Verificar se o bloqueio existe
    const block = await this.blockRepository.findByBlockerAndBlocked(blockerId, blockedId);
    if (!block) {
      throw new NotFoundException('Este usuário não está bloqueado');
    }

    // Remover o bloqueio
    await this.blockRepository.delete(blockerId, blockedId);

    return {
      success: true,
      message: 'Usuário desbloqueado com sucesso',
    };
  }
}

