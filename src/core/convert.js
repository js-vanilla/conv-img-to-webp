import { throwIfAborted } from './assert.js';
import { rasterToCanvas } from './canvas.js';
import { detectImageType, ImageType, isJpeg2000, isTiff, normalizeMimeType } from './detect.js';
import { UnsupportedFormatError } from './errors.js';
import { getMimeHint, toArrayBuffer } from './input.js';
import { decodeNativeToCanvas } from '../decoders/native.js';
import { encodeCanvasToWebP } from '../encoder/webp.js';

function isNativeBrowserType(type) {
  return type === ImageType.JPEG || type === ImageType.PNG || type === ImageType.GIF;
}

async function decodeToCanvas(input, options) {
  throwIfAborted(options.signal);

  const mimeHint = normalizeMimeType(options.mimeType || getMimeHint(input));
  const arrayBuffer = await toArrayBuffer(input);
  const type = normalizeMimeType(options.type) || detectImageType(new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, 64)), mimeHint);

  if (!type) {
    throw new UnsupportedFormatError('Could not detect image type. Supported input formats are JPG/JPEG, JPEG 2000/JP2/J2K, GIF, PNG, and TIFF.');
  }

  if (isNativeBrowserType(type)) {
    return {
      canvas: await decodeNativeToCanvas(arrayBuffer, type, options),
      type
    };
  }

  if (isTiff(type)) {
    const { decodeTiff } = await import('../decoders/tiff.js');
    const raster = await decodeTiff(arrayBuffer, options);
    return {
      canvas: rasterToCanvas(raster, options),
      type,
      meta: { page: raster.page, pageCount: raster.pageCount }
    };
  }

  if (isJpeg2000(type)) {
    const { decodeJpeg2000 } = await import('../decoders/jpeg2000.js');
    const raster = await decodeJpeg2000(arrayBuffer, options);
    return {
      canvas: rasterToCanvas(raster, options),
      type,
      meta: { components: raster.components }
    };
  }

  throw new UnsupportedFormatError(`Unsupported image type: ${type}.`);
}

export async function convertToWebP(input, options = {}) {
  const decoded = await decodeToCanvas(input, options);
  throwIfAborted(options.signal);
  return encodeCanvasToWebP(decoded.canvas, options);
}

export async function convertToWebPWithMetadata(input, options = {}) {
  const decoded = await decodeToCanvas(input, options);
  throwIfAborted(options.signal);
  const output = await encodeCanvasToWebP(decoded.canvas, options);
  return {
    output,
    inputType: decoded.type,
    metadata: decoded.meta || {}
  };
}
