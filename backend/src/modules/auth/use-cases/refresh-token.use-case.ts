import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../common/interfaces/use-case.interface';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthTokens } from '../interfaces/auth-response.interface';
import type { AuthRepositoryInterface } from '../interfaces/auth.repository.interface';
import { AUTH_REPOSITORY } from '../interfaces/auth.repository.interface';

@Injectable()
export class RefreshTokenUseCase implements UseCase<RefreshTokenDto, AuthTokens> {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepositoryInterface,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authRepository.refreshToken(dto.refreshToken!);
  }
}
