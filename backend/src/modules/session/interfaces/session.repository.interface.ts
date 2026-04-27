import { CreateSessionDto } from '../dto/create-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';

export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';

export interface SessionEntity {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  moodStart: number;
  moodEnd: number | null;
  tiltScore: number | null;
  games?: GameEntryEntity[];
}

export interface GameEntryEntity {
  id: string;
  sessionId: string;
  result: string;
  tiltLevel: number;
  tags: string[];
  createdAt: Date;
}

export interface SessionRepositoryInterface {
  create(userId: string, dto: CreateSessionDto): Promise<SessionEntity>;
  findAllByUser(userId: string): Promise<SessionEntity[]>;
  findById(id: string, userId: string): Promise<SessionEntity | null>;
  update(id: string, userId: string, dto: UpdateSessionDto): Promise<SessionEntity>;
  endSession(id: string, userId: string, dto: UpdateSessionDto): Promise<SessionEntity>;
  delete(id: string, userId: string): Promise<void>;
}
