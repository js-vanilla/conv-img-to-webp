import { assertInputSize, throwIfAborted } from './assert.js';
import { rasterToCanvas } from './canvas.js';
import { detectImageType, ImageType, isJpeg2000, isTiff, normalizeMimeType } from './detect.js';
import { DecodeError, UnsupportedFormatError } from './errors.js';
import { getMimeHint, toArrayBuffer } from './input.js';
import { decodeNativeToCanvas } from '../decoders/native.js';
import { encodeCanvasToWebP } from '../encoder/webp.js';
import type { CanvasLike, ConversionResult, ConvertToWebPOptions, ImageInput, OutputFor, SupportedImageType, WebPOutputKind } from '../types.js';

interface DecodedCanvas {
  canvas: CanvasLike;
  type: SupportedImageType;
  meta?: Record<string, unknown>;
}

function isLibraryError(error: unknown): error is { code: string } {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: unknown }).code);
}

function isNativeBrowserType(type: string | undefined): type is typeof ImageType.JPEG | typeof ImageType.PNG | typeof ImageType.GIF {
  return type === ImageType.JPEG || type === ImageType.PNG || type === ImageType.GIF;
}

async function readInputBytes(input: ImageInput, options: ConvertToWebPOptions<WebPOutputKind>): Promise<ArrayBuffer> {
  try {
    const arrayBuffer = await toArrayBuffer(input);
    assertInputSize(arrayBuffer.byteLength, options);
    return arrayBuffer;
  } catch (error) {
    if (isLibraryError(error) && (error.code === 'ABORTED' || error.code === 'DECODE_ERROR')) throw error;
    if (error instanceof TypeError) throw error;
    throw new DecodeError('Failed to read image input.', error);
  }
}

async function decodeToCanvas(input: ImageInput, options: ConvertToWebPOptions<WebPOutputKind>): Promise<DecodedCanvas> {
  throwIfAborted(options.signal);

  const mimeHint = normalizeMimeType(options.mimeType || getMimeHint(input));
  const arrayBuffer = await readInputBytes(input, options);
  throwIfAborted(options.signal);

  const header = new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, 64));
  const type = detectImageType(header, normalizeMimeType(options.type) || mimeHint);

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

export async function convertToWebP<TOutput extends WebPOutputKind | undefined = 'blob'>(
  input: ImageInput,
  options: ConvertToWebPOptions<NonNullable<TOutput>> = {} as ConvertToWebPOptions<NonNullable<TOutput>>
): Promise<OutputFor<TOutput>> {
  const decoded = await decodeToCanvas(input, options);
  throwIfAborted(options.signal);
  return encodeCanvasToWebP<TOutput>(decoded.canvas, options);
}

export async function convertToWebPWithMetadata<TOutput extends WebPOutputKind | undefined = 'blob'>(
  input: ImageInput,
  options: ConvertToWebPOptions<NonNullable<TOutput>> = {} as ConvertToWebPOptions<NonNullable<TOutput>>
): Promise<ConversionResult<TOutput>> {
  const decoded = await decodeToCanvas(input, options);
  throwIfAborted(options.signal);
  const output = await encodeCanvasToWebP<TOutput>(decoded.canvas, options);
  return {
    output,
    inputType: decoded.type,
    metadata: decoded.meta || {}
  };
}
