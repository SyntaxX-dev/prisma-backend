export class CommunityMessageAttachment {
  constructor(
    public readonly id: string,
    public readonly messageId: string,
    public readonly fileUrl: string,
    public readonly fileName: string,
    public readonly fileType: string,
    public readonly fileSize: number,
    public readonly cloudinaryPublicId: string,
    public readonly thumbnailUrl: string | null = null,
    public readonly width: number | null = null,
    public readonly height: number | null = null,
    public readonly duration: number | null = null,
    public readonly createdAt: Date,
  ) {}
}
