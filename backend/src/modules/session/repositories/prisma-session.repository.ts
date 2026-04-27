import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';
import {
  SessionEntity,
  SessionRepositoryInterface,
} from '../interfaces/session.repository.interface';

@Injectable()
export class PrismaSessionRepository implements SessionRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSessionDto): Promise<SessionEntity> {
    return this.prisma.session.create({
      data: {
        userId,
        moodStart: dto.moodStart,
      },
      include: { games: true },
    });
  }

  async findAllByUser(userId: string): Promise<SessionEntity[]> {
    return this.prisma.session.findMany({
      where: { userId },
      include: { games: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<SessionEntity | null> {
    return this.prisma.session.findFirst({
      where: { id, userId },
      include: { games: true },
    });
  }

  async update(id: string, userId: string, dto: UpdateSessionDto): Promise<SessionEntity> {
    const session = await this.prisma.session.findFirst({ where: { id, userId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.session.update({
      where: { id },
      data: {
        moodEnd: dto.moodEnd,
        tiltScore: dto.tiltScore,
      },
      include: { games: true },
    });
  }

  async endSession(id: string, userId: string, dto: UpdateSessionDto): Promise<SessionEntity> {
    const session = await this.prisma.session.findFirst({ where: { id, userId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.session.update({
      where: { id },
      data: {
        endTime: new Date(),
        moodEnd: dto.moodEnd,
        tiltScore: dto.tiltScore,
      },
      include: { games: true },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({ where: { id, userId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.gameEntry.deleteMany({ where: { sessionId: id } });
    await this.prisma.session.delete({ where: { id } });
  }
}
