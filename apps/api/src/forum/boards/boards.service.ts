import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const boards = await this.prisma.board.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return Promise.all(boards.map((board) => this.withStats(board)));
  }

  private async withStats<T extends { id: string }>(board: T) {
    const [threadCount, postCount, lastPost] = await Promise.all([
      this.prisma.thread.count({ where: { boardId: board.id, isDeleted: false } }),
      this.prisma.post.count({
        where: { thread: { boardId: board.id }, isDeleted: false },
      }),
      this.prisma.post.findFirst({
        where: { thread: { boardId: board.id }, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { username: true } },
          thread: { select: { id: true, title: true } },
        },
      }),
    ]);

    return {
      ...board,
      threadCount,
      postCount,
      lastPost: lastPost
        ? {
            threadId: lastPost.thread.id,
            threadTitle: lastPost.thread.title,
            authorUsername: lastPost.author.username,
            createdAt: lastPost.createdAt,
          }
        : null,
    };
  }

  async findBySlugOrThrow(slug: string) {
    const board = await this.prisma.board.findUnique({ where: { slug } });
    if (!board) {
      throw new NotFoundException('board not found');
    }
    return board;
  }

  async create(dto: CreateBoardDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.board.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('a board with this name already exists');
    }

    return this.prisma.board.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId,
      },
    });
  }
}
