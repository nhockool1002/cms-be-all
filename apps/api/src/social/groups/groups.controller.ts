import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Public()
  @Get('groups')
  list() {
    return this.groupsService.list();
  }

  @Public()
  @Get('groups/:slug')
  findOne(@Param('slug') slug: string) {
    return this.groupsService.findBySlugOrThrow(slug);
  }

  @Post('groups')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto);
  }

  @Post('groups/:slug/join')
  join(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.join(user.id, slug);
  }

  @Public()
  @Get('groups/:slug/discussions')
  listDiscussions(@Param('slug') slug: string, @Query() pagination: PaginationQueryDto) {
    return this.groupsService.listDiscussions(slug, pagination);
  }

  @Post('groups/:slug/discussions')
  createDiscussion(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDiscussionDto,
  ) {
    return this.groupsService.createDiscussion(user.id, slug, dto);
  }

  @Public()
  @Get('discussions/:id/replies')
  listReplies(@Param('id') id: string, @Query() pagination: PaginationQueryDto) {
    return this.groupsService.listReplies(id, pagination);
  }

  @Post('discussions/:id/replies')
  createReply(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReplyDto,
  ) {
    return this.groupsService.createReply(user.id, id, dto);
  }
}
