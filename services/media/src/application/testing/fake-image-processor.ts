import { PermanentMediaError } from '../../domain/media-errors.js';
import type { ImageProcessorPort, ProcessedImage } from '../ports/image-processor.port.js';

export class FakeImageProcessor implements ImageProcessorPort {
  /** Set to make `process` reject with PermanentMediaError -- simulates a corrupt/non-image upload. */
  rejectAsCorrupt = false;

  async process(data: Buffer): Promise<ProcessedImage> {
    if (this.rejectAsCorrupt) {
      throw new PermanentMediaError('not a valid image');
    }
    return { buffer: Buffer.from(`preview-of:${data.toString()}`), contentType: 'image/webp' };
  }
}
