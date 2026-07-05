import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { rankTitleForPostCount } from '../common/utils/rank-title';

const DEFAULT_ROLE_NAME = 'member';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async create(params: { username: string; email: string; passwordHash: string }) {
    const defaultRole = await this.prisma.role.upsert({
      where: { name: DEFAULT_ROLE_NAME },
      update: {},
      create: { name: DEFAULT_ROLE_NAME, description: 'Default role for new members' },
    });

    return this.prisma.user.create({
      data: {
        username: params.username,
        email: params.email,
        passwordHash: params.passwordHash,
        displayName: params.username,
        roles: {
          create: { roleId: defaultRole.id },
        },
      },
      include: { roles: { include: { role: true } } },
    });
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    const [postCount, threadCount, followerCount, followingCount] = await Promise.all([
      this.prisma.post.count({ where: { authorId: user.id, isDeleted: false } }),
      this.prisma.thread.count({ where: { authorId: user.id, isDeleted: false } }),
      this.prisma.follow.count({ where: { followingId: user.id } }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      joinedAt: user.createdAt,
      roles: user.roles.map((r) => r.role.name),
      rankTitle: rankTitleForPostCount(postCount),
      postCount,
      threadCount,
      followerCount,
      followingCount,
    };
  }
}
