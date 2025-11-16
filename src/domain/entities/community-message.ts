/**
 * Entidade CommunityMessage - Representa uma mensagem em uma comunidade
 * 
 * Esta entidade representa uma mensagem de chat em uma comunidade (chat de grupo).
 * Ela contém o conteúdo da mensagem, quem enviou, e em qual comunidade.
 */
export class CommunityMessage {
  constructor(
    public readonly id: string,
    public readonly communityId: string, // ID da comunidade
    public readonly senderId: string, // ID do usuário que enviou
    public content: string, // Conteúdo da mensagem
    public readonly createdAt: Date, // Quando foi criada
    public updatedAt: Date | null = null, // Quando foi editada (null se nunca foi editada)
    public isDeleted: boolean = false, // Se a mensagem foi deletada
    public deletedAt: Date | null = null, // Quando foi deletada (null se não foi)
  ) {}
}

