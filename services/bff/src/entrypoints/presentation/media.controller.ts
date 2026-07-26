import { BadRequestException, Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUserId } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { MediaHttpClient } from '../../infrastructure/http/media-http-client.js';
import type { MediaSummary } from '../../domain/listing-card.js';
import type { RawHttpResponse } from '../../infrastructure/http/raw-http.js';

/** Structural subset of Express.Multer.File -- see media service's own controller for why. */
interface UploadedMediaFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaClient: MediaHttpClient) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: UploadedMediaFile | undefined,
    @Body('listingId') listingId: string,
    @CurrentUserId() userId: string,
  ): Promise<MediaSummary> {
    if (!file) {
      throw new BadRequestException('missing "file" field');
    }
    return this.mediaClient.upload(userId, listingId, {
      buffer: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname,
    });
  }

  /**
   * `<img src>` can't send an `X-User-Id` header, and there's nothing
   * user-specific to check here anyway (preview bytes for a `ready` asset
   * aren't sensitive) -- so this is the one BFF route with no identity at
   * all, deliberately.
   */
  @Get(':id/file')
  async getFile(@Param('id') id: string, @Res() res: RawHttpResponse): Promise<void> {
    const upstream = await this.mediaClient.getFile(id);
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const bytes = new Uint8Array(await upstream.arrayBuffer());
    res.writeHead(200, { 'Content-Type': contentType });
    res.write(bytes);
    res.end();
  }
}
