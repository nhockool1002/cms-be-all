import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { slugify } from '../../common/utils/slugify';
import { renderMarkdown } from '../../common/utils/render-markdown';
import { CreateThreadDto } from './dto/create-thread.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardsService: BoardsService,
  ) {}

  async listByBoard(boardSlug: string, pagination: PaginationQueryDto) {
    const board = await this.boardsService.findBySlugOrThrow(boardSlug);
    const { page, pageSize } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.thread.findMany({
        where: { boardId: board.id, isDeleted: false },
        orderBy: [{ isPinned: 'desc' }, { lastPostAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.thread.count({ where: { boardId: board.id, isDeleted: false } }),
    ]);

    return { items, total, page, pageSize };
  }

  async findByIdOrThrow(id: string) {
    const thread = await this.prisma.thread.findUnique({ where: { id } });
    if (!thread || thread.isDeleted) {
      throw new NotFoundException('thread not found');
    }
    return thread;
  }

  async create(boardSlug: string, authorId: string, dto: CreateThreadDto) {
    const board = await this.boardsService.findBySlugOrThrow(boardSlug);
    const slug = slugify(dto.title);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const thread = await tx.thread.create({
        data: {
          boardId: board.id,
          authorId,
          title: dto.title,
          slug,
          lastPostAt: now,
        },
      });

      await tx.post.create({
        data: {
          threadId: thread.id,
          authorId,
          bodyMarkdown: dto.bodyMarkdown,
          bodyHtml: renderMarkdown(dto.bodyMarkdown),
          isFirstPost: true,
        },
      });

      return thread;
    });
  }
}
