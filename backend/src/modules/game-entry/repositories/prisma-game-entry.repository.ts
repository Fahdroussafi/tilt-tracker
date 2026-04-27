import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { CreateGameEntryDto } from '../dto/create-game-entry.dto';
import {
  GameEntryEntity,
  GameEntryRepositoryInterface,
} from '../interfaces/game-entry.repository.interface';

@Injectable()
export class PrismaGameEntryRepository implements GameEntryRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    sessionId: string,
    userId: string,
    dto: CreateGameEntryDto,
  ): Promise<GameEntryEntity> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.gameEntry.create({
      data: {
        sessionId,
        result: dto.result,
        tiltLevel: dto.tiltLevel,
        tags: dto.tags || [],
      },
    });
  }

  async findBySession(sessionId: string, userId: string): Promise<GameEntryEntity[]> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.gameEntry.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const entry = await this.prisma.gameEntry.findFirst({
      where: { id },
      include: { session: true },
    });
    if (!entry || entry.session.userId !== userId) {
      throw new NotFoundException('Game entry not found');
    }

    await this.prisma.gameEntry.delete({ where: { id } });
  }
}
