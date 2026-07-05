import { Module } from '@nestjs/common';
import { FollowsController, FollowListController } from './follows.controller';
import { FollowsService } from './follows.service';

@Module({
  controllers: [FollowsController, FollowListController],
  providers: [FollowsService],
})
export class FollowsModule {}
