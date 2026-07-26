export const IMAGE_PROCESSOR = Symbol('IMAGE_PROCESSOR');

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
}

export interface ImageProcessorPort {
  /** Throws `PermanentMediaError` if `data` isn't a processable image -- see domain/media-errors.ts. */
  process(data: Buffer): Promise<ProcessedImage>;
}
