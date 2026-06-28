import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/healthz')
  health() {
    return { status: 'ok', service: 'lumin-api', ts: new Date().toISOString() };
  }

  @Get('/ready')
  ready() {
    return { ready: true };
  }
}
