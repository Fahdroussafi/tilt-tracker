import { CreateGameEntryDto } from '../dto/create-game-entry.dto';

export const GAME_ENTRY_REPOSITORY = 'GAME_ENTRY_REPOSITORY';

export interface GameEntryEntity {
  id: string;
  sessionId: string;
  result: string;
  tiltLevel: number;
  tags: string[];
  createdAt: Date;
}

export interface GameEntryRepositoryInterface {
  create(sessionId: string, userId: string, dto: CreateGameEntryDto): Promise<GameEntryEntity>;
  findBySession(sessionId: string, userId: string): Promise<GameEntryEntity[]>;
  delete(id: string, userId: string): Promise<void>;
}
