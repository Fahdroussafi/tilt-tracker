import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthTokens, UserProfile } from '../interfaces/auth-response.interface';
import { AuthRepositoryInterface } from '../interfaces/auth.repository.interface';

@Injectable()
export class PrismaAuthRepository implements AuthRepositoryInterface {
  private readonly accessExpiry: number;
  private readonly refreshExpiry: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    this.accessExpiry = this.parseExpiry(
      this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
    );
    this.refreshExpiry = this.parseExpiry(
      this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d',
    );
  }

  async register(dto: RegisterDto): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        username: dto.username,
      },
    });

    return { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user.id, user.email);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const storedToken = await this.redis.get(`refresh:${payload.sub}`);
      if (storedToken && storedToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token revoked');
      }
    } catch {
      // Skip Redis check if down
    }

    return this.generateTokens(payload.sub, payload.email);
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    try {
      await this.redis.del(`refresh:${userId}`);
      await this.redis.set(`bl:${accessToken}`, '1', 'EX', this.accessExpiry);
    } catch {
      // Ignore Redis errors on logout
    }
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt };
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.accessExpiry });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: this.refreshExpiry });

    try {
      await this.redis.set(`refresh:${userId}`, refreshToken, 'EX', this.refreshExpiry);
    } catch {
      // Ignore Redis errors
    }

    return { accessToken, refreshToken, expiresIn: this.accessExpiry };
  }

  private parseExpiry(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900;
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return num * (multipliers[unit] || 1);
  }
}
