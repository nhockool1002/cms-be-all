import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Public()
  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.menusService.findByNameOrThrow(name);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @Roles('admin')
  @Post(':name/items')
  addItem(@Param('name') name: string, @Body() dto: CreateMenuItemDto) {
    return this.menusService.addItem(name, dto);
  }
}
