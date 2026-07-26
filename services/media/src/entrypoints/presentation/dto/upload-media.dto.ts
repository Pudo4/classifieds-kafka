import { z } from 'zod';

export const uploadMediaBodySchema = z.object({
  listingId: z.string().uuid(),
});
export type UploadMediaBody = z.infer<typeof uploadMediaBodySchema>;

/** Structural subset of Express.Multer.File -- avoids depending on @types/express just for this shape. */
export interface UploadedMediaFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export const ALLOWED_MEDIA_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024;
