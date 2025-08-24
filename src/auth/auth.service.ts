import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes, createHash } from 'crypto';

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  private accessTtl = process.env.JWT_ACCESS_TTL || '15m';
  private refreshTtlDays = Number(process.env.JWT_REFRESH_TTL_DAYS || '7');

  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  //Registro Configuration

  async register(email: string, password: string) {
    const exist = await this.users.findByEmail(email);
    if (exist) throw new BadRequestException('Email already registered');

    const passwordHash = await argon2.hash(password);
    const user = await this.users.create({ email, passwordHash });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  //Login Configuration

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    //Invalidation of old refresh tokens.
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  //Refresh token configuration

  async refresh(refreshToken: string) {
    const tokenHash = sha256(refreshToken);

    const found = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!found) throw new UnauthorizedException('Invalid refresh token');

    const user = found.user;

    //Token Expiration
    if (found.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: found.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    //Send new tokens
    const tokens = await this.issueTokens(user.id, user.email, user.role);

    //Replace refresh token
    await this.prisma.refreshToken.delete({ where: { id: found.id } });
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  //Logout configuration
  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { success: true };
  }

  // HELPERS
  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessTtl,
    });

    const refreshToken = randomBytes(32).toString('hex');

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }
}
