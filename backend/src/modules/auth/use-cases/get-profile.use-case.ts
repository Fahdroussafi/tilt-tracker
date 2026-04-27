import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../common/interfaces/use-case.interface';
import { UserProfile } from '../interfaces/auth-response.interface';
import type { AuthRepositoryInterface } from '../interfaces/auth.repository.interface';
import { AUTH_REPOSITORY } from '../interfaces/auth.repository.interface';

@Injectable()
export class GetProfileUseCase implements UseCase<string, UserProfile> {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<UserProfile> {
    return this.authRepository.getProfile(userId);
  }
}
