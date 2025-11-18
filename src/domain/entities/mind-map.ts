export class MindMap {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly videoId: string,
    public readonly content: string,
    public readonly videoTitle: string,
    public readonly videoUrl: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    userId: string,
    videoId: string,
    content: string,
    videoTitle: string,
    videoUrl: string,
  ): Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId,
      videoId,
      content,
      videoTitle,
      videoUrl,
    };
  }
}
