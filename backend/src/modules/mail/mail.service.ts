import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * SMTP mailer (nodemailer). Replaces the previous "log the token" stub so
 * account-activation and password-reset emails are actually delivered.
 *
 * Configure via SMTP_HOST/PORT/SECURE/USER/PASS + MAIL_FROM (see .env.example).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const mail = this.config.get<{
      host: string;
      port: number;
      secure: boolean;
      ignoreTLS: boolean;
      rejectUnauthorized: boolean;
      user: string;
      pass: string;
      from: string;
    }>('mail')!;

    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      // Do not attempt a STARTTLS upgrade — plaintext servers (MailHog) reject
      // it and the connection dies with [PROTO: INVALID].
      ignoreTLS: mail.ignoreTLS,
      tls: { rejectUnauthorized: mail.rejectUnauthorized },
      // Only attach auth when credentials are provided (e.g. local MailHog needs none).
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });

    // Surface misconfiguration at boot instead of on first send.
    this.transporter.verify().then(
      () => this.logger.log(`SMTP ready at ${mail.host}:${mail.port}`),
      (err) => this.logger.error(`SMTP verification failed: ${err?.message ?? err}`),
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const from = this.config.get<string>('mail.from')!;
    const info = await this.transporter.sendMail({ from, to, subject, html });
    this.logger.log(`Email "${subject}" sent to ${to} (messageId: ${info.messageId})`);
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const link = `${appUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Activate your JovStack account',
      `<p>Hi ${name},</p>
       <p>Welcome to JovStack! Confirm your email to activate your account:</p>
       <p><a href="${link}">Activate account</a></p>
       <p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>`,
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const link = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Reset your JovStack password',
      `<p>We received a request to reset your password.</p>
       <p><a href="${link}">Reset password</a></p>
       <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
    );
  }
}
