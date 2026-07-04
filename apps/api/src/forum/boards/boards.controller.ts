import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Public()
  @Get()
  list() {
    return this.boardsService.list();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.boardsService.findBySlugOrThrow(slug);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateBoardDto) {
    return this.boardsService.create(dto);
  }
}
