import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProfileCommentsService } from './profile-comments.service';
import { CreateProfileCommentDto } from './dto/create-profile-comment.dto';

@Controller('users/:userId/comments')
export class ProfileCommentsController {
  constructor(private readonly profileCommentsService: ProfileCommentsService) {}

  @Public()
  @Get()
  list(@Param('userId') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.profileCommentsService.listForUser(userId, pagination);
  }

  @Post()
  create(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfileCommentDto,
  ) {
    return this.profileCommentsService.create(user.id, userId, dto);
  }
}
