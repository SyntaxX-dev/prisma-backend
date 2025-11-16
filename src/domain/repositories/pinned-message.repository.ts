/**
 * Interface PinnedMessageRepository - Define como acessar mensagens fixadas
 */

export interface PinnedMessage {
  id: string;
  messageId: string;
  pinnedBy: string;
  userId1: string;
  userId2: string;
  pinnedAt: Date;
}

export interface PinnedMessageWithDetails extends PinnedMessage {
  message: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
  };
  pinnedByUser: {
    id: string;
    name: string;
  };
}

export interface PinnedMessageRepository {
  /**
   * Fixa uma mensagem em uma conversa
   */
  pinMessage(
    messageId: string,
    pinnedBy: string,
    userId1: string,
    userId2: string,
  ): Promise<PinnedMessage>;

  /**
   * Desfixa uma mensagem
   */
  unpinMessage(messageId: string): Promise<void>;

  /**
   * Busca todas as mensagens fixadas de uma conversa
   */
  findByConversation(userId1: string, userId2: string): Promise<PinnedMessageWithDetails[]>;

  /**
   * Verifica se uma mensagem está fixada
   */
  isPinned(messageId: string): Promise<boolean>;

  /**
   * Busca mensagem fixada por ID da mensagem
   */
  findByMessageId(messageId: string): Promise<PinnedMessage | null>;
}

