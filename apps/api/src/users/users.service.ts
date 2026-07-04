import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
