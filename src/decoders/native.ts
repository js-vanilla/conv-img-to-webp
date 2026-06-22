import { assertImageDimensions, throwIfAborted } from '../core/assert.js';
import { closeBitmap, createCanvas, get2dContext } from '../core/canvas.js';
import { DecodeError } from '../core/errors.js';
import { toBlob } from '../core/input.js';
import type { CanvasLike, ConvertToWebPOptions, WebPOutputKind, ImageInput, SupportedImageType } from '../types.js';

function isLibraryDecodeError(error: unknown): error is { code: string } {
  return Boolean(error && typeof error === 'object' && 'code' in error && ((error as { code?: unknown }).code === 'ABORTED' || (error as { code?: unknown }).code === 'DECODE_ERROR'));
}

function dimensionsOf(bitmap: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  if ('naturalWidth' in bitmap) {
    return {
      width: bitmap.naturalWidth || bitmap.width || 0,
      height: bitmap.naturalHeight || bitmap.height || 0
    };
  }
  return { width: bitmap.width, height: bitmap.height };
}

export async function decodeNativeToCanvas(input: ImageInput, mimeType: SupportedImageType, options: ConvertToWebPOptions<WebPOutputKind> = {}): Promise<CanvasLike> {
  throwIfAborted(options.signal);

  const blob = await toBlob(input, mimeType);
  let bitmap: ImageBitmap | HTMLImageElement | undefined;
  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(blob, {
        imageOrientation: options.imageOrientation || 'from-image',
        colorSpaceConversion: options.colorSpaceConversion || 'default',
        premultiplyAlpha: 'default'
      });
    } else if (typeof Image !== 'undefined' && typeof URL !== 'undefined') {
      bitmap = await loadHtmlImage(blob);
    } else {
      throw new DecodeError('No native browser image decoder is available.');
    }

    throwIfAborted(options.signal);
    const { width, height } = dimensionsOf(bitmap);
    assertImageDimensions(width, height, options);

    const canvas = createCanvas(width, height, options.canvasFactory, options);
    const ctx = get2dContext(canvas, { willReadFrequently: false });
    ctx.drawImage(bitmap, 0, 0);
    return canvas;
  } catch (error) {
    if (isLibraryDecodeError(error)) throw error;
    throw new DecodeError(`Native browser decoding failed for ${mimeType}.`, error);
  } finally {
    closeBitmap(bitmap);
  }
}

function loadHtmlImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new DecodeError('HTMLImageElement failed to decode the image.'));
    };
    img.src = url;
  });
}
