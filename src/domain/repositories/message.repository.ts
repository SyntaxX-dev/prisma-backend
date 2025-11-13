import { Message } from '../entities/message';

/**
 * Interface MessageRepository - Define como acessar mensagens no banco de dados
 * 
 * Esta interface define os métodos que qualquer implementação de repositório
 * de mensagens deve ter. Isso permite trocar a implementação facilmente.
 */
export interface MessageRepository {
  /**
   * Cria uma nova mensagem no banco de dados
   */
  create(senderId: string, receiverId: string, content: string): Promise<Message>;

  /**
   * Busca uma mensagem pelo ID
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Busca mensagens entre dois usuários (conversa)
   * @param userId1 - ID do primeiro usuário
   * @param userId2 - ID do segundo usuário
   * @param limit - Quantidade máxima de mensagens
   * @param offset - Quantas mensagens pular (para paginação)
   */
  findByUsers(
    userId1: string,
    userId2: string,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;

  /**
   * Busca mensagens não lidas de um usuário
   */
  findUnreadByReceiverId(receiverId: string): Promise<Message[]>;

  /**
   * Marca uma mensagem como lida
   */
  markAsRead(messageId: string): Promise<void>;

  /**
   * Marca todas as mensagens entre dois usuários como lidas
   */
  markAllAsRead(senderId: string, receiverId: string): Promise<void>;

  /**
   * Conta quantas mensagens não lidas um usuário tem
   */
  countUnread(receiverId: string): Promise<number>;
}

