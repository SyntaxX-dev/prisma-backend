import { CommunityMessage } from '../entities/community-message';

/**
 * Interface CommunityMessageRepository - Define como acessar mensagens de comunidades no banco de dados
 * 
 * Esta interface define os métodos que qualquer implementação de repositório
 * de mensagens de comunidades deve ter.
 */
export interface CommunityMessageRepository {
  /**
   * Cria uma nova mensagem em uma comunidade
   */
  create(communityId: string, senderId: string, content: string): Promise<CommunityMessage>;

  /**
   * Busca uma mensagem pelo ID
   */
  findById(id: string): Promise<CommunityMessage | null>;

  /**
   * Busca mensagens de uma comunidade
   * @param communityId - ID da comunidade
   * @param limit - Quantidade máxima de mensagens
   * @param offset - Quantas mensagens pular (para paginação)
   */
  findByCommunity(
    communityId: string,
    limit?: number,
    offset?: number,
  ): Promise<CommunityMessage[]>;

  /**
   * Conta o total de mensagens de uma comunidade
   */
  countByCommunity(communityId: string): Promise<number>;

  /**
   * Atualiza o conteúdo de uma mensagem
   */
  update(messageId: string, content: string): Promise<CommunityMessage>;

  /**
   * Deleta uma mensagem (soft delete - marca como deletada)
   */
  delete(messageId: string): Promise<void>;
}

