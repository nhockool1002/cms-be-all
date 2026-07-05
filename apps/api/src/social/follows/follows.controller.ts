import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.types';
import { FollowsService } from './follows.service';

@Controller('users/:userId/follow')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post()
  follow(@Param('userId') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.followsService.follow(user.id, userId);
  }

  @Delete()
  unfollow(@Param('userId') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.followsService.unfollow(user.id, userId);
  }
}

@Controller('users/:userId')
export class FollowListController {
  constructor(private readonly followsService: FollowsService) {}

  @Public()
  @Get('followers')
  followers(@Param('userId') userId: string) {
    return this.followsService.listFollowers(userId);
  }

  @Public()
  @Get('following')
  following(@Param('userId') userId: string) {
    return this.followsService.listFollowing(userId);
  }
}
