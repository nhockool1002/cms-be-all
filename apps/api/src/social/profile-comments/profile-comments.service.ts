import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateProfileCommentDto } from './dto/create-profile-comment.dto';

@Injectable()
export class ProfileCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(profileUserId: string, pagination: PaginationQueryDto) {
    await this.assertUserExists(profileUserId);
    const { page, pageSize } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.profileComment.findMany({
        where: { profileUserId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { username: true } } },
      }),
      this.prisma.profileComment.count({ where: { profileUserId } }),
    ]);

    return { items, total, page, pageSize };
  }

  async create(authorId: string, profileUserId: string, dto: CreateProfileCommentDto) {
    await this.assertUserExists(profileUserId);

    return this.prisma.profileComment.create({
      data: { profileUserId, authorId, body: dto.body },
      include: { author: { select: { username: true } } },
    });
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
  }
}
