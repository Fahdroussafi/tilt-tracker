import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/modules/prisma/prisma.module';
import { SessionController } from './session.controller';
import { SESSION_REPOSITORY } from './interfaces/session.repository.interface';
import { PrismaSessionRepository } from './repositories/prisma-session.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SessionController],
  providers: [
    {
      provide: SESSION_REPOSITORY,
      useClass: PrismaSessionRepository,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionModule {}
