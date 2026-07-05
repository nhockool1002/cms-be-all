import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('cannot follow yourself');
    }
    await this.assertUserExists(followingId);

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      throw new ConflictException('already following this user');
    }

    return this.prisma.follow.create({ data: { followerId, followingId } });
  }

  async unfollow(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return { success: true };
  }

  async listFollowers(userId: string) {
    await this.assertUserExists(userId);
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ username: r.follower.username, since: r.createdAt }));
  }

  async listFollowing(userId: string) {
    await this.assertUserExists(userId);
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ username: r.following.username, since: r.createdAt }));
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
  }
}
