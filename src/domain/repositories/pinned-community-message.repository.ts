/**
 * Interface PinnedCommunityMessageRepository - Define como acessar mensagens fixadas de comunidades
 */

export interface PinnedCommunityMessage {
  id: string;
  messageId: string;
  communityId: string;
  pinnedBy: string;
  pinnedAt: Date;
}

export interface PinnedCommunityMessageWithDetails
  extends PinnedCommunityMessage {
  message: {
    id: string;
    communityId: string;
    senderId: string;
    content: string;
    createdAt: Date;
  };
  pinnedByUser: {
    id: string;
    name: string;
  };
}

export interface PinnedCommunityMessageRepository {
  /**
   * Fixa uma mensagem em uma comunidade
   */
  pinMessage(
    messageId: string,
    communityId: string,
    pinnedBy: string,
  ): Promise<PinnedCommunityMessage>;

  /**
   * Desfixa uma mensagem
   */
  unpinMessage(messageId: string): Promise<void>;

  /**
   * Busca todas as mensagens fixadas de uma comunidade
   */
  findByCommunity(
    communityId: string,
  ): Promise<PinnedCommunityMessageWithDetails[]>;

  /**
   * Verifica se uma mensagem está fixada
   */
  isPinned(messageId: string): Promise<boolean>;

  /**
   * Busca mensagem fixada por ID da mensagem
   */
  findByMessageId(messageId: string): Promise<PinnedCommunityMessage | null>;
}
