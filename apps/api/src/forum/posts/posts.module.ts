import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { ThreadsModule } from '../threads/threads.module';

@Module({
  imports: [ThreadsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
