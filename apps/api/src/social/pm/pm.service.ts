import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class PmService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { username: true } } } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { username: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { createdAt: 'desc' } },
    });

    return participations.map(({ conversation }) => ({
      id: conversation.id,
      subject: conversation.subject,
      createdAt: conversation.createdAt,
      participants: conversation.participants
        .map((p) => p.user.username)
        .filter((username) => username),
      lastMessage: conversation.messages[0]
        ? {
            body: conversation.messages[0].body,
            senderUsername: conversation.messages[0].sender.username,
            createdAt: conversation.messages[0].createdAt,
          }
        : null,
    }));
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const recipients = await this.prisma.user.findMany({
      where: { username: { in: dto.participantUsernames } },
      select: { id: true, username: true },
    });

    if (recipients.length !== new Set(dto.participantUsernames).size) {
      throw new BadRequestException('one or more usernames could not be found');
    }

    const participantIds = new Set([userId, ...recipients.map((r) => r.id)]);

    return this.prisma.conversation.create({
      data: {
        subject: dto.subject,
        participants: {
          create: [...participantIds].map((id) => ({ userId: id })),
        },
        messages: {
          create: { senderId: userId, body: dto.body },
        },
      },
      include: { participants: true, messages: true },
    });
  }

  async listMessages(userId: string, conversationId: string, pagination: PaginationQueryDto) {
    await this.assertParticipant(userId, conversationId);
    const { page, pageSize } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { sender: { select: { username: true } } },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { items, total, page, pageSize };
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    await this.assertParticipant(userId, conversationId);

    return this.prisma.message.create({
      data: { conversationId, senderId: userId, body: dto.body },
      include: { sender: { select: { username: true } } },
    });
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation) {
        throw new NotFoundException('conversation not found');
      }
      throw new ForbiddenException('not a participant of this conversation');
    }
  }
}
