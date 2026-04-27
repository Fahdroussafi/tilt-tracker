import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../common/interfaces/use-case.interface';
import type { AuthRepositoryInterface } from '../interfaces/auth.repository.interface';
import { AUTH_REPOSITORY } from '../interfaces/auth.repository.interface';

interface LogoutInput {
  userId: string;
  accessToken: string;
}

@Injectable()
export class LogoutUseCase implements UseCase<LogoutInput, void> {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepositoryInterface,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    return this.authRepository.logout(input.userId, input.accessToken);
  }
}
