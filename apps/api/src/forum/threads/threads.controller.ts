import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';

@Controller()
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Public()
  @Get('boards/:boardSlug/threads')
  listByBoard(@Param('boardSlug') boardSlug: string, @Query() pagination: PaginationQueryDto) {
    return this.threadsService.listByBoard(boardSlug, pagination);
  }

  @Public()
  @Get('threads/:id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findByIdOrThrow(id);
  }

  @Post('boards/:boardSlug/threads')
  create(
    @Param('boardSlug') boardSlug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateThreadDto,
  ) {
    return this.threadsService.create(boardSlug, user.id, dto);
  }
}
