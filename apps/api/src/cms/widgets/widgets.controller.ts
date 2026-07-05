import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { WidgetsService } from './widgets.service';
import { CreateWidgetDto } from './dto/create-widget.dto';

@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Public()
  @Get()
  listByPlacement(@Query('placement') placement: string) {
    return this.widgetsService.listByPlacement(placement);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateWidgetDto) {
    return this.widgetsService.create(dto);
  }
}
