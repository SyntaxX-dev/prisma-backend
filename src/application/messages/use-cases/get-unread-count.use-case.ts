/**
 * GetUnreadCountUseCase - Lógica para contar mensagens não lidas
 *
 * Retorna quantas mensagens não lidas um usuário tem no total.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MESSAGE_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';

export interface GetUnreadCountInput {
  userId: string;
}

export interface GetUnreadCountOutput {
  unreadCount: number;
}

@Injectable()
export class GetUnreadCountUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(input: GetUnreadCountInput): Promise<GetUnreadCountOutput> {
    const { userId } = input;

    const unreadCount = await this.messageRepository.countUnread(userId);

    return {
      unreadCount,
    };
  }
}
