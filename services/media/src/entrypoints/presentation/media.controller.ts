import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUserId, ZodValidationPipe } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI --
// `import type` would erase it and break resolution at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { MediaService } from '../media.service.js';
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
  uploadMediaBodySchema,
  type UploadedMediaFile,
  type UploadMediaBody,
} from './dto/upload-media.dto.js';
import { toMediaResponse, type MediaResponse } from './media.response.js';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_MEDIA_FILE_SIZE_BYTES } }))
  async upload(
    @UploadedFile() file: UploadedMediaFile | undefined,
    @Body(new ZodValidationPipe(uploadMediaBodySchema)) body: UploadMediaBody,
    @CurrentUserId() userId: string,
  ): Promise<MediaResponse> {
    if (!file) {
      throw new BadRequestException('missing "file" field');
    }
    // Deliberately not validated any deeper than the declared content type
    // -- a file that claims to be an image but isn't is exactly the
    // "corrupt upload" case the processing pipeline (and its DLQ path) is
    // meant to catch, not something to reject at the door.
    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`unsupported content type "${file.mimetype}"`);
    }

    const asset = await this.mediaService.upload({
      listingId: body.listingId,
      ownerId: userId,
      data: file.buffer,
      contentType: file.mimetype,
    });
    return toMediaResponse(asset);
  }

  @Get('by-listing/:listingId')
  async listForListing(@Param('listingId') listingId: string): Promise<MediaResponse[]> {
    const assets = await this.mediaService.listReadyForListing(listingId);
    return assets.map(toMediaResponse);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<MediaResponse> {
    const asset = await this.mediaService.findById(id);
    if (!asset) throw new NotFoundException(`media asset "${id}" not found`);
    return toMediaResponse(asset);
  }

  /** Preview is always re-encoded to webp by SharpImageProcessor -- content type is never asset-dependent. */
  @Get(':id/file')
  @Header('Content-Type', 'image/webp')
  async getFile(@Param('id') id: string): Promise<StreamableFile> {
    const data = await this.mediaService.getPreviewFile(id);
    if (!data) throw new NotFoundException(`preview for media asset "${id}" not ready`);
    return new StreamableFile(data);
  }
}
