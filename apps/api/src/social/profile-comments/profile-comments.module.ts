import { Module } from '@nestjs/common';
import { ProfileCommentsController } from './profile-comments.controller';
import { ProfileCommentsService } from './profile-comments.service';

@Module({
  controllers: [ProfileCommentsController],
  providers: [ProfileCommentsService],
})
export class ProfileCommentsModule {}
