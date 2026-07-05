import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async findByNameOrThrow(name: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { name },
      include: { items: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!menu) {
      throw new NotFoundException('menu not found');
    }
    return menu;
  }

  async create(dto: CreateMenuDto) {
    const existing = await this.prisma.menu.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('a menu with this name already exists');
    }
    return this.prisma.menu.create({ data: { name: dto.name } });
  }

  async addItem(menuName: string, dto: CreateMenuItemDto) {
    const menu = await this.findByNameOrThrow(menuName);
    return this.prisma.menuItem.create({
      data: {
        menuId: menu.id,
        label: dto.label,
        url: dto.url,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }
}
