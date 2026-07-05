import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { renderMarkdown } from '../../common/utils/render-markdown';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.page.findMany({
      where: { status: PageStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findPublishedBySlugOrThrow(slug: string) {
    const page = await this.prisma.page.findUnique({ where: { slug } });
    if (!page || page.status !== PageStatus.PUBLISHED) {
      throw new NotFoundException('page not found');
    }
    return page;
  }

  listAll() {
    return this.prisma.page.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async findByIdOrThrow(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException('page not found');
    }
    return page;
  }

  async create(authorId: string, dto: CreatePageDto) {
    const slug = slugify(dto.title);
    const existing = await this.prisma.page.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('a page with this title already exists');
    }

    const status = dto.status ?? PageStatus.DRAFT;
    return this.prisma.page.create({
      data: {
        title: dto.title,
        slug,
        authorId,
        bodyMarkdown: dto.bodyMarkdown,
        bodyHtml: renderMarkdown(dto.bodyMarkdown),
        status,
        publishedAt: status === PageStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  async update(id: string, editorId: string, dto: UpdatePageDto) {
    const page = await this.findByIdOrThrow(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.bodyMarkdown && dto.bodyMarkdown !== page.bodyMarkdown) {
        await tx.pageVersion.create({
          data: { pageId: id, bodyMarkdown: page.bodyMarkdown, editedById: editorId },
        });
      }

      const becomingPublished = dto.status === PageStatus.PUBLISHED && page.status !== PageStatus.PUBLISHED;

      return tx.page.update({
        where: { id },
        data: {
          title: dto.title,
          bodyMarkdown: dto.bodyMarkdown,
          bodyHtml: dto.bodyMarkdown ? renderMarkdown(dto.bodyMarkdown) : undefined,
          status: dto.status,
          publishedAt: becomingPublished ? new Date() : undefined,
        },
      });
    });
  }
}
