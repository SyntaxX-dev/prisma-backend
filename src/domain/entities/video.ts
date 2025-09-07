export class Video {
  constructor(
    public readonly id: string,
    public readonly subCourseId: string,
    public readonly videoId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly url: string,
    public readonly thumbnailUrl: string | null,
    public readonly duration: number | null,
    public readonly channelTitle: string | null,
    public readonly publishedAt: Date | null,
    public readonly viewCount: number | null,
    public readonly tags: string[] | null,
    public readonly category: string | null,
    public readonly order: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    subCourseId: string,
    videoId: string,
    title: string,
    url: string,
    description?: string,
    thumbnailUrl?: string,
    duration?: number,
    channelTitle?: string,
    publishedAt?: Date,
    viewCount?: number,
    tags?: string[],
    category?: string,
    order?: number,
  ): Omit<Video, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      subCourseId,
      videoId,
      title,
      description: description || null,
      url,
      thumbnailUrl: thumbnailUrl || null,
      duration: duration || null,
      channelTitle: channelTitle || null,
      publishedAt: publishedAt || null,
      viewCount: viewCount || null,
      tags: tags || null,
      category: category || null,
      order: order || 0,
    };
  }
}
