import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PmService } from './pm.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations')
export class PmController {
  constructor(private readonly pmService: PmService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.pmService.listConversations(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateConversationDto) {
    return this.pmService.createConversation(user.id, dto);
  }

  @Get(':id/messages')
  listMessages(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.pmService.listMessages(user.id, id, pagination);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.pmService.sendMessage(user.id, id, dto);
  }
}
