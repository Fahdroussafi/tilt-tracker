import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../common/interfaces/use-case.interface';
import { RegisterDto } from '../dto/register.dto';
import { UserProfile } from '../interfaces/auth-response.interface';
import type { AuthRepositoryInterface } from '../interfaces/auth.repository.interface';
import { AUTH_REPOSITORY } from '../interfaces/auth.repository.interface';

@Injectable()
export class RegisterUseCase implements UseCase<RegisterDto, UserProfile> {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepositoryInterface,
  ) {}

  async execute(dto: RegisterDto): Promise<UserProfile> {
    return this.authRepository.register(dto);
  }
}
