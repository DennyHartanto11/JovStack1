import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

/**
 * Root controller. Without this, `GET /api/v1` (the base path) matches no route
 * and Nest returns 404 NOT_FOUND. Provides a service banner + health probe.
 */
@Controller()
export class AppController {
  @Public()
  @Get()
  root() {
    return {
      name: 'JovStack API',
      version: '1.0',
      docs: '/api/v1/docs',
    };
  }

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
