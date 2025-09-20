export class VideoProgress {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly videoId: string,
    public readonly subCourseId: string,
    public readonly isCompleted: boolean,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    userId: string,
    videoId: string,
    subCourseId: string,
    isCompleted: boolean = false,
  ): Omit<VideoProgress, 'id' | 'createdAt' | 'updatedAt'> {
    const instance = new VideoProgress(
      '', // id será gerado pelo repositório
      userId,
      videoId,
      subCourseId,
      isCompleted,
      isCompleted ? new Date() : null,
      new Date(), // createdAt
      new Date(), // updatedAt
    );
    
    return {
      userId: instance.userId,
      videoId: instance.videoId,
      subCourseId: instance.subCourseId,
      isCompleted: instance.isCompleted,
      completedAt: instance.completedAt,
      markAsCompleted: instance.markAsCompleted.bind(instance),
      markAsIncomplete: instance.markAsIncomplete.bind(instance),
    };
  }

  markAsCompleted(): VideoProgress {
    return new VideoProgress(
      this.id,
      this.userId,
      this.videoId,
      this.subCourseId,
      true,
      new Date(),
      this.createdAt,
      new Date(),
    );
  }

  markAsIncomplete(): VideoProgress {
    return new VideoProgress(
      this.id,
      this.userId,
      this.videoId,
      this.subCourseId,
      false,
      null,
      this.createdAt,
      new Date(),
    );
  }
}
