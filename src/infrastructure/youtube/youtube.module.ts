import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YouTubeService } from '../services/youtube.service';
import { YouTubeChannelService } from '../services/youtube-channel.service';

@Module({
  imports: [ConfigModule],
  providers: [YouTubeService, YouTubeChannelService],
  exports: [YouTubeService, YouTubeChannelService],
})
export class YouTubeModule {}
