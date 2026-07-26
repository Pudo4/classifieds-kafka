import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { z } from 'zod';

const userIdSchema = z.string().uuid();

interface MinimalHttpRequest {
  headers: Record<string, string | string[] | undefined>;
}

/**
 * There is no auth in this project (see README boundaries): the caller is
 * whatever `X-User-Id` says. This decorator is the one place that header is
 * read and validated, so no controller can accidentally trust an
 * unvalidated value.
 */
export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<MinimalHttpRequest>();
  const raw = request.headers['x-user-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const result = userIdSchema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException('missing or invalid X-User-Id header (must be a uuid)');
  }
  return result.data;
});
