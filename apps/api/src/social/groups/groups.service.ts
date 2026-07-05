import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberStatus, GroupVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const groups = await this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });

    return groups.map((group) => ({ ...group, memberCount: group._count.members }));
  }

  async findBySlugOrThrow(slug: string) {
    const group = await this.prisma.group.findUnique({
      where: { slug },
      include: { _count: { select: { members: true } } },
    });
    if (!group) {
      throw new NotFoundException('group not found');
    }
    return { ...group, memberCount: group._count.members };
  }

  async create(ownerId: string, dto: CreateGroupDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.group.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('a group with this name already exists');
    }

    return this.prisma.group.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        ownerId,
        visibility: (dto.visibility as GroupVisibility) ?? GroupVisibility.PUBLIC,
        members: {
          create: { userId: ownerId, role: 'OWNER', status: 'ACTIVE' },
        },
      },
    });
  }

  async join(userId: string, slug: string) {
    const group = await this.findBySlugOrThrow(slug);

    if (group.visibility === GroupVisibility.INVITE_ONLY) {
      throw new ForbiddenException('this group is invite-only');
    }

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) {
      throw new ConflictException('already a member of this group');
    }

    const status: GroupMemberStatus =
      group.visibility === GroupVisibility.MODERATED ? 'PENDING' : 'ACTIVE';

    return this.prisma.groupMember.create({
      data: { groupId: group.id, userId, status, role: 'MEMBER' },
    });
  }

  async listDiscussions(slug: string, pagination: PaginationQueryDto) {
    const group = await this.findBySlugOrThrow(slug);
    const { page, pageSize } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.groupDiscussion.findMany({
        where: { groupId: group.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { username: true } }, _count: { select: { replies: true } } },
      }),
      this.prisma.groupDiscussion.count({ where: { groupId: group.id } }),
    ]);

    return {
      items: items.map((d) => ({
        ...d,
        authorUsername: d.author.username,
        replyCount: d._count.replies,
      })),
      total,
      page,
      pageSize,
    };
  }

  async createDiscussion(userId: string, slug: string, dto: CreateDiscussionDto) {
    const group = await this.findBySlugOrThrow(slug);
    await this.assertActiveMember(group.id, userId);

    return this.prisma.$transaction(async (tx) => {
      const discussion = await tx.groupDiscussion.create({
        data: { groupId: group.id, authorId: userId, title: dto.title },
      });
      await tx.groupDiscussionReply.create({
        data: { discussionId: discussion.id, authorId: userId, body: dto.body },
      });
      return discussion;
    });
  }

  async listReplies(discussionId: string, pagination: PaginationQueryDto) {
    const { page, pageSize } = pagination;
    const [items, total] = await Promise.all([
      this.prisma.groupDiscussionReply.findMany({
        where: { discussionId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { username: true } } },
      }),
      this.prisma.groupDiscussionReply.count({ where: { discussionId } }),
    ]);

    return { items, total, page, pageSize };
  }

  async createReply(userId: string, discussionId: string, dto: CreateReplyDto) {
    const discussion = await this.prisma.groupDiscussion.findUnique({
      where: { id: discussionId },
    });
    if (!discussion) {
      throw new NotFoundException('discussion not found');
    }
    await this.assertActiveMember(discussion.groupId, userId);

    return this.prisma.groupDiscussionReply.create({
      data: { discussionId, authorId: userId, body: dto.body },
    });
  }

  private async assertActiveMember(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException('must be an active member of this group');
    }
  }
}
