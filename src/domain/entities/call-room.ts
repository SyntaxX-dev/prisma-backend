export class CallRoom {
  constructor(
    public readonly id: string,
    public readonly callerId: string,
    public readonly receiverId: string,
    public readonly status: 'ringing' | 'active' | 'ended' | 'rejected' | 'missed',
    public readonly startedAt: Date,
    public readonly answeredAt: Date | null,
    public readonly endedAt: Date | null,
    public readonly duration: number | null,
    public readonly createdAt: Date,
  ) {}
}

