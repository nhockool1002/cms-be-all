import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.types';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Public()
  @Get()
  listPublished() {
    return this.pagesService.listPublished();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.pagesService.findPublishedBySlugOrThrow(slug);
  }
}

@Controller('admin/pages')
export class AdminPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Roles('admin')
  @Get()
  listAll() {
    return this.pagesService.listAll();
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findByIdOrThrow(id);
  }

  @Roles('admin')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePageDto) {
    return this.pagesService.create(user.id, dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.update(id, user.id, dto);
  }
}
