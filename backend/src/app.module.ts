import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ValidationPipe } from '@nestjs/common';
import configuration from './config/configuration';
import { validateEnv } from './config/validate-env';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { MembershipModule } from './modules/membership/membership.module';
import { WebsiteModule } from './modules/website/website.module';
import { PageModule } from './modules/page/page.module';
import { MediaModule } from './modules/media/media.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { ContactRequestModule } from './modules/contact-request/contact-request.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PublicSiteModule } from './modules/public-site/public-site.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]), // 30 requests per 60s global; auth endpoints override lower
    PrismaModule,
    MailModule,
    AuditLogModule,
    AuthModule,
    OrganizationModule,
    MembershipModule,
    WebsiteModule,
    PageModule,
    MediaModule,
    ProductModule,
    OrderModule,
    ContactRequestModule,
    DashboardModule,
    PublicSiteModule,
  ],
  controllers: [AppController],
  providers: [
    // Authentication runs first (global); @Public() routes opt out.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true, // reject unknown fields instead of stripping
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
