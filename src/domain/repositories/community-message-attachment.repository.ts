import { CommunityMessageAttachment } from '../entities/community-message-attachment';

export interface CommunityMessageAttachmentRepository {
  create(attachment: {
    messageId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    cloudinaryPublicId: string;
    thumbnailUrl?: string | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
  }): Promise<CommunityMessageAttachment>;
  findByMessageId(messageId: string): Promise<CommunityMessageAttachment[]>;
  findByCommunityId(communityId: string): Promise<CommunityMessageAttachment[]>;
  deleteByMessageId(messageId: string): Promise<void>;
  deleteById(id: string): Promise<void>;
}
