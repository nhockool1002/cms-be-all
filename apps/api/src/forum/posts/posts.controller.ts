import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get('threads/:threadId/posts')
  listByThread(@Param('threadId') threadId: string, @Query() pagination: PaginationQueryDto) {
    return this.postsService.listByThread(threadId, pagination);
  }

  @Post('threads/:threadId/posts')
  create(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(threadId, user.id, dto);
  }

  @Patch('posts/:id')
  edit(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.edit(id, user.id, dto.bodyMarkdown);
  }
}
