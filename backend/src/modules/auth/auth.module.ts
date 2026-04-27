import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../common/modules/prisma/prisma.module';
import { RedisModule } from '../../common/modules/redis/redis.module';
import { AuthController } from './auth.controller';
import { AUTH_REPOSITORY } from './interfaces/auth.repository.interface';
import { PrismaAuthRepository } from './repositories/prisma-auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GetProfileUseCase } from './use-cases/get-profile.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { RegisterUseCase } from './use-cases/register.use-case';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'secret',
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRY') ||
            '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  providers: [
    {
      provide: AUTH_REPOSITORY,
      useClass: PrismaAuthRepository,
    },
    RegisterUseCase,
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    GetProfileUseCase,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AUTH_REPOSITORY, JwtModule],
})
export class AuthModule {}
