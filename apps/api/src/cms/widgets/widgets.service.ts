import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWidgetDto } from './dto/create-widget.dto';

@Injectable()
export class WidgetsService {
  constructor(private readonly prisma: PrismaService) {}

  listByPlacement(placement: string) {
    return this.prisma.widget.findMany({
      where: { placement },
      orderBy: { displayOrder: 'asc' },
    });
  }

  create(dto: CreateWidgetDto) {
    return this.prisma.widget.create({
      data: {
        type: dto.type,
        placement: dto.placement,
        config: dto.config as Prisma.InputJsonValue,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }
}
