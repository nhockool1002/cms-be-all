import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ThreadsService } from '../threads/threads.service';
import { renderMarkdown } from '../../common/utils/render-markdown';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threadsService: ThreadsService,
  ) {}

  async listByThread(threadId: string, pagination: PaginationQueryDto) {
    await this.threadsService.findByIdOrThrow(threadId);
    const { page, pageSize } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { threadId, isDeleted: false },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.post.count({ where: { threadId, isDeleted: false } }),
    ]);

    return { items, total, page, pageSize };
  }

  async create(threadId: string, authorId: string, dto: CreatePostDto) {
    const thread = await this.threadsService.findByIdOrThrow(threadId);
    if (thread.isLocked) {
      throw new ForbiddenException('thread is locked');
    }

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          threadId,
          authorId,
          bodyMarkdown: dto.bodyMarkdown,
          bodyHtml: renderMarkdown(dto.bodyMarkdown),
        },
      });

      await tx.thread.update({
        where: { id: threadId },
        data: { lastPostAt: now },
      });

      return post;
    });
  }

  async edit(postId: string, editorId: string, bodyMarkdown: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.isDeleted) {
      throw new NotFoundException('post not found');
    }
    if (post.authorId !== editorId) {
      throw new ForbiddenException('cannot edit another user\'s post');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.postRevision.create({
        data: {
          postId,
          bodyMarkdown: post.bodyMarkdown,
          editedById: editorId,
        },
      });

      return tx.post.update({
        where: { id: postId },
        data: {
          bodyMarkdown,
          bodyHtml: renderMarkdown(bodyMarkdown),
          editedAt: new Date(),
          editedBy: editorId,
        },
      });
    });
  }
}
