export class Block {
  constructor(
    public readonly id: string,
    public readonly blockerId: string, // Usuário que bloqueou
    public readonly blockedId: string, // Usuário bloqueado
    public readonly createdAt: Date,
  ) {}
}

