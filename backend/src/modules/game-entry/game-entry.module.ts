import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/modules/prisma/prisma.module';
import { GameEntryController } from './game-entry.controller';
import { GAME_ENTRY_REPOSITORY } from './interfaces/game-entry.repository.interface';
import { PrismaGameEntryRepository } from './repositories/prisma-game-entry.repository';

@Module({
  imports: [PrismaModule],
  controllers: [GameEntryController],
  providers: [
    {
      provide: GAME_ENTRY_REPOSITORY,
      useClass: PrismaGameEntryRepository,
    },
  ],
  exports: [GAME_ENTRY_REPOSITORY],
})
export class GameEntryModule {}
