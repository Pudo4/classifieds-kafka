import sharp from 'sharp';
import { PermanentMediaError } from '../../domain/media-errors.js';
import type { ImageProcessorPort, ProcessedImage } from '../../application/ports/image-processor.port.js';
import { errorMessage } from '../error-message.js';

const PREVIEW_WIDTH = 400;

export class SharpImageProcessor implements ImageProcessorPort {
  async process(data: Buffer): Promise<ProcessedImage> {
    try {
      const buffer = await sharp(data)
        .rotate() // bakes in EXIF orientation before that metadata is dropped, so the preview isn't sideways
        .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
        // Re-encoding to webp without .withMetadata() is what actually
        // strips EXIF/ICC/other metadata -- it's a consequence of building
        // a fresh output, not an implicit side effect to just assume.
        .webp({ quality: 80 })
        .toBuffer();
      return { buffer, contentType: 'image/webp' };
    } catch (error) {
      throw new PermanentMediaError(`unable to process image: ${errorMessage(error)}`);
    }
  }
}
