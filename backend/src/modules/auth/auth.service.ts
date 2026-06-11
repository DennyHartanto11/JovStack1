import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { TokenType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MailService } from '../mail/mail.service';
import { TokenService, IssuedTokens } from './token.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const VERIFY_TTL = 60 * 60 * 24; // 24h
const RESET_TTL = 60 * 60; // 1h

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditLogService,
    private readonly mail: MailService,
  ) {}

  private toUser(u: { id: string; name: string; email: string; avatarColor: string; avatarUrl: string | null }) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatarColor: u.avatarColor,
      ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Email is already in use',
        fields: { email: 'Email is already in use' },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: await argon2.hash(dto.password),
      },
    });

    const token = await this.tokens.createActionToken(user.id, TokenType.EmailVerification, VERIFY_TTL);
    await this.mail.sendVerificationEmail(user.email, user.name, token);

    await this.audit.record({ userId: user.id, action: 'auth.register', entity: 'User', entityId: user.id });

    return { user: this.toUser(user), verificationRequired: true as const };
  }

  async login(dto: LoginDto): Promise<{ user: ReturnType<AuthService['toUser']> } & IssuedTokens> {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Invalid credentials' });
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in',
      });
    }

    const session = await this.tokens.issueSession(user.id, user.email);
    await this.audit.record({ userId: user.id, action: 'auth.login', entity: 'User', entityId: user.id });
    return { user: this.toUser(user), ...session };
  }

  async refresh(rawToken: string | undefined): Promise<IssuedTokens> {
    if (!rawToken) throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Missing refresh token' });
    try {
      return await this.tokens.rotateRefresh(rawToken);
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Invalid refresh token' });
    }
  }

  async logout(userId: string) {
    await this.tokens.revokeAllForUser(userId);
    await this.audit.record({ userId, action: 'auth.logout', entity: 'User', entityId: userId });
    return { success: true };
  }

  async verifyEmail(token: string) {
    let userId: string;
    try {
      userId = await this.tokens.consumeActionToken(token, TokenType.EmailVerification);
    } catch {
      throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
    }
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    await this.audit.record({ userId, action: 'auth.verify_email', entity: 'User', entityId: userId });
    return { verified: true };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    // Always return ok to avoid user enumeration.
    if (user && !user.emailVerified) {
      const token = await this.tokens.createActionToken(user.id, TokenType.EmailVerification, VERIFY_TTL);
      await this.mail.sendVerificationEmail(user.email, user.name, token);
    }
    return { sent: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    if (user) {
      const token = await this.tokens.createActionToken(user.id, TokenType.PasswordReset, RESET_TTL);
      await this.mail.sendPasswordResetEmail(user.email, token);
    }
    // Do not reveal whether the email exists.
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Passwords do not match',
        fields: { confirmPassword: 'Passwords do not match' },
      });
    }
    let userId: string;
    try {
      userId = await this.tokens.consumeActionToken(dto.token, TokenType.PasswordReset);
    } catch {
      throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(dto.password) },
    });
    await this.tokens.revokeAllForUser(userId); // invalidate sessions after reset
    await this.audit.record({ userId, action: 'auth.reset_password', entity: 'User', entityId: userId });
    return { reset: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toUser(user);
  }
}
