import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ThreadsService } from '../threads/threads.service';
import { renderMarkdown } from '../../common/utils/render-markdown';
import { rankTitleForPostCount } from '../../common/utils/rank-title';
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

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { threadId, isDeleted: false },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              createdAt: true,
              roles: { include: { role: true } },
            },
          },
        },
      }),
      this.prisma.post.count({ where: { threadId, isDeleted: false } }),
    ]);

    const authorIds = [...new Set(posts.map((post) => post.authorId))];
    const postCounts = await this.prisma.post.groupBy({
      by: ['authorId'],
      where: { authorId: { in: authorIds }, isDeleted: false },
      _count: { _all: true },
    });
    const postCountByAuthor = new Map(postCounts.map((row) => [row.authorId, row._count._all]));

    const items = posts.map((post) => {
      const postCount = postCountByAuthor.get(post.authorId) ?? 0;
      return {
        ...post,
        author: {
          username: post.author.username,
          avatarUrl: post.author.avatarUrl,
          joinedAt: post.author.createdAt,
          postCount,
          roles: post.author.roles.map((r) => r.role.name),
          rankTitle: rankTitleForPostCount(postCount),
        },
      };
    });

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
