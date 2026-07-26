import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

/**
 * Factory instead of a static class: each service needs a controller bound
 * to its own name, and Nest controllers can't take constructor args from
 * the module that declares them without a custom provider.
 */
export function createHealthController(serviceName: string): new () => { check(): HealthResponse } {
  @Controller('health')
  class HealthController {
    @Get()
    check(): HealthResponse {
      return { status: 'ok', service: serviceName, timestamp: new Date().toISOString() };
    }
  }
  return HealthController;
}
