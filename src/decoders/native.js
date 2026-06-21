import { throwIfAborted } from '../core/assert.js';
import { closeBitmap, createCanvas, get2dContext } from '../core/canvas.js';
import { DecodeError } from '../core/errors.js';
import { toBlob } from '../core/input.js';

export async function decodeNativeToCanvas(input, mimeType, options = {}) {
  throwIfAborted(options.signal);

  const blob = await toBlob(input, mimeType);
  let bitmap;
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
    const canvas = createCanvas(bitmap.width || bitmap.naturalWidth, bitmap.height || bitmap.naturalHeight, options.canvasFactory);
    const ctx = get2dContext(canvas, { willReadFrequently: false });
    ctx.drawImage(bitmap, 0, 0);
    return canvas;
  } catch (error) {
    if (error && error.code === 'ABORTED') throw error;
    throw new DecodeError(`Native browser decoding failed for ${mimeType}.`, error);
  } finally {
    closeBitmap(bitmap);
  }
}

function loadHtmlImage(blob) {
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
