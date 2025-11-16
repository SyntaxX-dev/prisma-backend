import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { COMMUNITY_MESSAGE_REPOSITORY } from '../../../domain/tokens';
import type { CommunityMessageRepository } from '../../../domain/repositories/community-message.repository';

export interface EditCommunityMessageInput {
  messageId: string;
  userId: string;
  newContent: string;
}

export interface EditCommunityMessageOutput {
  success: boolean;
  message: {
    id: string;
    communityId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date | null;
  };
}

@Injectable()
export class EditCommunityMessageUseCase {
  private readonly EDIT_TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

  constructor(
    @Inject(COMMUNITY_MESSAGE_REPOSITORY)
    private readonly communityMessageRepository: CommunityMessageRepository,
  ) {}

  async execute(input: EditCommunityMessageInput): Promise<EditCommunityMessageOutput> {
    const { messageId, userId, newContent } = input;

    // Validar conteúdo
    if (!newContent || newContent.trim().length === 0) {
      throw new BadRequestException('O conteúdo da mensagem não pode estar vazio');
    }

    if (newContent.length > 10000) {
      throw new BadRequestException('O conteúdo da mensagem é muito longo (máximo 10000 caracteres)');
    }

    // Buscar mensagem
    const message = await this.communityMessageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Verificar se o usuário é o remetente
    if (message.senderId !== userId) {
      throw new ForbiddenException('Você só pode editar suas próprias mensagens');
    }

    // Verificar tempo limite (5 minutos)
    const now = new Date();
    const messageAge = now.getTime() - message.createdAt.getTime();

    if (messageAge > this.EDIT_TIME_LIMIT_MS) {
      const minutesPassed = Math.floor(messageAge / (60 * 1000));
      throw new BadRequestException(
        `Você só pode editar mensagens enviadas há menos de 5 minutos. Esta mensagem foi enviada há ${minutesPassed} minutos.`,
      );
    }

    // Atualizar mensagem
    const updatedMessage = await this.communityMessageRepository.update(messageId, newContent.trim());

    return {
      success: true,
      message: {
        id: updatedMessage.id,
        communityId: updatedMessage.communityId,
        senderId: updatedMessage.senderId,
        content: updatedMessage.content,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
      },
    };
  }
}

