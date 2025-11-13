/**
 * Entidade Message - Representa uma mensagem entre dois usuários
 * 
 * Esta entidade representa uma mensagem de chat entre dois usuários que são amigos.
 * Ela contém o conteúdo da mensagem, quem enviou, quem recebeu, e status de leitura.
 */
export class Message {
  constructor(
    public readonly id: string,
    public readonly senderId: string, // ID do usuário que enviou
    public readonly receiverId: string, // ID do usuário que recebeu
    public readonly content: string, // Conteúdo da mensagem
    public isRead: boolean, // Se a mensagem foi lida
    public readonly createdAt: Date, // Quando foi criada
    public readAt: Date | null, // Quando foi lida (null se não foi lida)
  ) {}
}

