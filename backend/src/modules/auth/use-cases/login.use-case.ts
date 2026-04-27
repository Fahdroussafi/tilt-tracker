import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../common/interfaces/use-case.interface';
import { LoginDto } from '../dto/login.dto';
import { AuthTokens } from '../interfaces/auth-response.interface';
import type { AuthRepositoryInterface } from '../interfaces/auth.repository.interface';
import { AUTH_REPOSITORY } from '../interfaces/auth.repository.interface';

@Injectable()
export class LoginUseCase implements UseCase<LoginDto, AuthTokens> {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepositoryInterface,
  ) {}

  async execute(loginDto: LoginDto): Promise<AuthTokens> {
    return this.authRepository.login(loginDto);
  }
}
