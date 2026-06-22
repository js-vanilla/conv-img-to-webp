import { assertImageDimensions, assertInputSize, assertRgbaBufferLength, throwIfAborted } from '../core/assert.js';
import { DecodeError, InvalidPageError, MissingPageError } from '../core/errors.js';
import { toArrayBuffer } from '../core/input.js';
import type { ConvertToWebPOptions, WebPOutputKind, ImageInput, RasterImage } from '../types.js';

interface TiffIfd {
  width?: unknown;
  height?: unknown;
  [key: string]: unknown;
}

interface UtifLike {
  decode(buffer: ArrayBuffer): TiffIfd[];
  decodeImage(buffer: ArrayBuffer, ifd: TiffIfd, ifds: TiffIfd[]): void;
  toRGBA8(ifd: TiffIfd): Uint8Array | Uint8ClampedArray | ArrayBuffer | ArrayLike<number> | null | undefined;
}

function resolveUTIF(moduleNamespace: unknown): UtifLike {
  const namespace = moduleNamespace as { default?: unknown; UTIF?: unknown };
  return (namespace.default || namespace.UTIF || moduleNamespace) as UtifLike;
}

function assertPage(page: unknown, pageCount: number): asserts page is number {
  if (!Number.isInteger(page)) {
    throw new InvalidPageError(`TIFF page must be a zero-based integer. Received: ${String(page)}.`);
  }
  if ((page as number) < 0 || (page as number) >= pageCount) {
    throw new InvalidPageError(`TIFF page ${String(page)} is out of range. Page count is ${pageCount}.`);
  }
}

function readDimension(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new DecodeError(`TIFF decoder returned an invalid ${name}: ${String(value)}.`);
  }
  return value;
}

async function readTiffBytes(input: ImageInput, options: ConvertToWebPOptions<WebPOutputKind>): Promise<ArrayBuffer> {
  const arrayBuffer = await toArrayBuffer(input);
  assertInputSize(arrayBuffer.byteLength, options);
  return arrayBuffer;
}

function toUint8Buffer(rgba: Uint8Array | Uint8ClampedArray | ArrayBuffer | ArrayLike<number>): Uint8Array {
  if (rgba instanceof Uint8Array) return rgba;
  if (rgba instanceof Uint8ClampedArray) return new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  if (rgba instanceof ArrayBuffer) return new Uint8Array(rgba);
  return Uint8Array.from(rgba);
}

export async function getTiffPageCount(input: ImageInput, options: ConvertToWebPOptions<WebPOutputKind> = {}): Promise<number> {
  throwIfAborted(options.signal);
  const [arrayBuffer, moduleNamespace] = await Promise.all([readTiffBytes(input, options), import('utif2')]);
  const UTIF = resolveUTIF(moduleNamespace);

  try {
    const ifds = UTIF.decode(arrayBuffer);
    if (!Array.isArray(ifds)) throw new DecodeError('TIFF decoder returned an invalid page list.');
    return ifds.length;
  } catch (error) {
    if (error instanceof DecodeError) throw error;
    throw new DecodeError('Failed to count TIFF pages.', error);
  }
}

export async function decodeTiff(input: ImageInput, options: ConvertToWebPOptions<WebPOutputKind> = {}): Promise<RasterImage & { page: number; pageCount: number }> {
  throwIfAborted(options.signal);

  const [arrayBuffer, moduleNamespace] = await Promise.all([readTiffBytes(input, options), import('utif2')]);
  const UTIF = resolveUTIF(moduleNamespace);

  try {
    const ifds = UTIF.decode(arrayBuffer);
    if (!Array.isArray(ifds)) throw new DecodeError('TIFF decoder returned an invalid page list.');

    const pageCount = ifds.length;
    if (pageCount === 0) {
      throw new DecodeError('TIFF file contains no pages/images.');
    }

    if (pageCount > 1 && options.page === undefined) {
      throw new MissingPageError(`Multi-page TIFF input has ${pageCount} pages. Pass { page } explicitly as a zero-based page number.`);
    }

    const page = options.page === undefined ? 0 : options.page;
    assertPage(page, pageCount);

    const ifd = ifds[page];
    if (!ifd) throw new DecodeError(`TIFF page ${page} is missing.`);
    UTIF.decodeImage(arrayBuffer, ifd, ifds);
    throwIfAborted(options.signal);

    const width = readDimension(ifd.width, 'width');
    const height = readDimension(ifd.height, 'height');
    assertImageDimensions(width, height, options);

    const rgba = UTIF.toRGBA8(ifd);
    if (!rgba) {
      throw new DecodeError(`Failed to decode TIFF page ${page}.`);
    }

    const data = toUint8Buffer(rgba);
    assertRgbaBufferLength(data, width, height);

    return {
      data,
      width,
      height,
      page,
      pageCount,
      format: 'image/tiff'
    };
  } catch (error) {
    if (error instanceof MissingPageError || error instanceof InvalidPageError || error instanceof DecodeError) throw error;
    throw new DecodeError('TIFF decoding failed.', error);
  }
}
