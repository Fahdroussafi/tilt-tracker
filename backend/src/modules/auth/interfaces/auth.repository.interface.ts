import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthTokens, UserProfile } from './auth-response.interface';

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export interface AuthRepositoryInterface {
  register(dto: RegisterDto): Promise<UserProfile>;
  login(dto: LoginDto): Promise<AuthTokens>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(userId: string, accessToken: string): Promise<void>;
  getProfile(userId: string): Promise<UserProfile>;
}
