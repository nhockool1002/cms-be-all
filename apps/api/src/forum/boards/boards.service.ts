import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.board.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
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
