import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenType } from '@prisma/client';

export interface IssuedTokens {
  accessToken: string;
  expiresIn: number; // seconds
  refreshToken: string; // raw — set as HttpOnly cookie, never in body
}

/**
 * Centralizes JWT issuance, refresh-token rotation, and one-time action tokens
 * (email verification / password reset). Refresh tokens are stored hashed so a
 * DB leak does not expose usable tokens (security spec).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private ttlToSeconds(ttl: string): number {
    const m = /^(\d+)([smhd])$/.exec(ttl);
    if (!m) return parseInt(ttl, 10) || 900;
    const n = parseInt(m[1], 10);
    return { s: n, m: n * 60, h: n * 3600, d: n * 86400 }[m[2]]!;
  }

  async issueSession(userId: string, email: string): Promise<IssuedTokens> {
    const accessTtl = this.config.get<string>('jwt.accessTtl')!;
    const refreshTtl = this.config.get<string>('jwt.refreshTtl')!;

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      { secret: this.config.get('jwt.accessSecret'), expiresIn: accessTtl },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: randomBytes(16).toString('hex') },
      { secret: this.config.get('jwt.refreshSecret'), expiresIn: refreshTtl },
    );

    const refreshSeconds = this.ttlToSeconds(refreshTtl);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + refreshSeconds * 1000),
      },
    });

    return { accessToken, expiresIn: this.ttlToSeconds(accessTtl), refreshToken };
  }

  /**
   * Validates a presented refresh token, revokes it, and issues a new pair
   * (rotation). Throws if the token is unknown, expired, or already revoked.
   */
  async rotateRefresh(rawToken: string): Promise<IssuedTokens> {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(rawToken, {
        secret: this.config.get('jwt.refreshSecret'),
      });
    } catch {
      throw new Error('INVALID_REFRESH');
    }

    const candidates = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let matched: (typeof candidates)[number] | undefined;
    for (const c of candidates) {
      if (await argon2.verify(c.tokenHash, rawToken)) {
        matched = c;
        break;
      }
    }
    if (!matched) throw new Error('INVALID_REFRESH');

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    return this.issueSession(user.id, user.email);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Creates a one-time action token, returning the raw token to email. */
  async createActionToken(userId: string, type: TokenType, ttlSeconds: number): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    await this.prisma.actionToken.create({
      data: {
        userId,
        type,
        tokenHash: createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });
    return raw;
  }

  /** Consumes a one-time action token, returning the userId on success. */
  async consumeActionToken(raw: string, type: TokenType): Promise<string> {
    const hash = createHash('sha256').update(raw).digest('hex');
    const token = await this.prisma.actionToken.findFirst({
      where: { tokenHash: hash, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!token) throw new Error('INVALID_ACTION_TOKEN');
    await this.prisma.actionToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });
    return token.userId;
  }
}
