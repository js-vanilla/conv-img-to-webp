import { assertImageDimensions, assertInputSize, throwIfAborted } from '../core/assert.js';
import { DecodeError } from '../core/errors.js';
import { toArrayBuffer } from '../core/input.js';
import type { ConvertToWebPOptions, WebPOutputKind, ImageInput, RasterImage } from '../types.js';

interface Jpeg2000Tile {
  left?: unknown;
  top?: unknown;
  width?: unknown;
  height?: unknown;
  items: ArrayLike<number>;
}

interface Jpeg2000TileInfo {
  tileWidth: number;
  tileHeight: number;
  left: number;
  top: number;
}

interface JpxImageLike {
  width?: unknown;
  height?: unknown;
  componentsCount?: unknown;
  components?: unknown;
  tiles?: unknown;
  parse(data: Uint8Array): void;
}

type JpxImageConstructor = new () => JpxImageLike;

function readProperty<T extends object, K extends PropertyKey>(value: T, key: K): unknown {
  return key in value ? (value as Record<K, unknown>)[key] : undefined;
}

function resolveJpxImage(moduleNamespace: unknown): JpxImageConstructor | undefined {
  if (!moduleNamespace || typeof moduleNamespace !== 'object') return undefined;
  const namespace = moduleNamespace as Record<string, unknown>;
  const direct = namespace.JpxImage;
  if (typeof direct === 'function') return direct as JpxImageConstructor;

  const defaultExport = namespace.default;
  if (typeof defaultExport === 'function') return defaultExport as JpxImageConstructor;
  if (defaultExport && typeof defaultExport === 'object') {
    const nested = (defaultExport as Record<string, unknown>).JpxImage;
    if (typeof nested === 'function') return nested as JpxImageConstructor;
  }
  return undefined;
}

function readNumber(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new DecodeError(`JPEG 2000 decoder returned an invalid ${name}: ${String(value)}.`);
  }
  return value;
}

function readComponentMetadata(image: JpxImageLike): number | undefined {
  if (typeof image.componentsCount === 'number') return image.componentsCount;
  if (image.components && typeof image.components === 'object') {
    const length = readProperty(image.components, 'length');
    if (typeof length === 'number') return length;
    const count = readProperty(image.components, 'count');
    if (typeof count === 'number') return count;
  }
  return undefined;
}

function resolveComponents(image: JpxImageLike, tile: Jpeg2000Tile & { width: number; height: number }): number {
  const metadataComponents = readComponentMetadata(image);
  if (typeof metadataComponents === 'number' && Number.isInteger(metadataComponents) && metadataComponents >= 1 && metadataComponents <= 4) {
    return metadataComponents;
  }

  const pixelCount = tile.width * tile.height;
  if (!Number.isSafeInteger(pixelCount) || pixelCount < 1) {
    throw new DecodeError('JPEG 2000 decoder returned invalid tile dimensions.');
  }

  const derived = tile.items.length / pixelCount;
  if (Number.isInteger(derived) && derived >= 1 && derived <= 4) {
    return derived;
  }

  throw new DecodeError(`Unsupported JPEG 2000 component layout. Unable to derive 1-4 components from ${tile.items.length} samples for ${pixelCount} pixels.`);
}

function assertSupportedComponents(components: number): void {
  if (!Number.isInteger(components) || components < 1 || components > 4) {
    throw new DecodeError(`Unsupported JPEG 2000 component count: ${components}. Only grayscale, grayscale+alpha, RGB, and RGBA are supported.`);
  }
}

function asTile(tile: unknown, index: number): Jpeg2000Tile {
  if (!tile || typeof tile !== 'object') {
    throw new DecodeError(`JPEG 2000 tile ${index} contains no pixel data.`);
  }
  const items = readProperty(tile, 'items');
  if (!items || typeof items !== 'object' || typeof readProperty(items, 'length') !== 'number') {
    throw new DecodeError(`JPEG 2000 tile ${index} contains no pixel data.`);
  }
  return tile as Jpeg2000Tile;
}

function assertTile(tileValue: unknown, width: number, height: number, index: number): { tile: Jpeg2000Tile; info: Jpeg2000TileInfo } {
  const tile = asTile(tileValue, index);
  const tileWidth = readNumber(tile.width, `tile ${index} width`);
  const tileHeight = readNumber(tile.height, `tile ${index} height`);
  const left = readNumber(tile.left ?? 0, `tile ${index} left offset`);
  const top = readNumber(tile.top ?? 0, `tile ${index} top offset`);

  if (tileWidth < 1 || tileHeight < 1) {
    throw new DecodeError(`JPEG 2000 tile ${index} has empty dimensions: ${tileWidth}x${tileHeight}.`);
  }
  if (left + tileWidth > width || top + tileHeight > height) {
    throw new DecodeError(`JPEG 2000 tile ${index} (${left},${top},${tileWidth}x${tileHeight}) is outside image bounds ${width}x${height}.`);
  }

  return { tile, info: { tileWidth, tileHeight, left, top } };
}

function assertTileLength(tile: Jpeg2000Tile, components: number, tileWidth: number, tileHeight: number, index: number): void {
  const expected = tileWidth * tileHeight * components;
  if (tile.items.length !== expected) {
    throw new DecodeError(`JPEG 2000 tile ${index} sample length mismatch: expected ${expected}, received ${tile.items.length}.`);
  }
}

function byteSample(items: ArrayLike<number>, offset: number): number {
  const value = items[offset];
  if (!Number.isFinite(value) || value < 0 || value > 255) {
    throw new DecodeError('Unsupported JPEG 2000 sample range. Only 8-bit component data is supported by this lightweight decoder path.');
  }
  return value & 0xff;
}

function writePixel(items: ArrayLike<number>, sampleOffset: number, components: number, output: Uint8Array, pixelOffset: number): void {
  if (components === 1) {
    const v = byteSample(items, sampleOffset);
    output[pixelOffset] = v;
    output[pixelOffset + 1] = v;
    output[pixelOffset + 2] = v;
    output[pixelOffset + 3] = 255;
    return;
  }

  if (components === 2) {
    const v = byteSample(items, sampleOffset);
    output[pixelOffset] = v;
    output[pixelOffset + 1] = v;
    output[pixelOffset + 2] = v;
    output[pixelOffset + 3] = byteSample(items, sampleOffset + 1);
    return;
  }

  output[pixelOffset] = byteSample(items, sampleOffset);
  output[pixelOffset + 1] = byteSample(items, sampleOffset + 1);
  output[pixelOffset + 2] = byteSample(items, sampleOffset + 2);
  output[pixelOffset + 3] = components === 4 ? byteSample(items, sampleOffset + 3) : 255;
}

function writeTileToRgba(tile: Jpeg2000Tile, tileInfo: Jpeg2000TileInfo, components: number, output: Uint8Array, width: number, index: number): void {
  assertTileLength(tile, components, tileInfo.tileWidth, tileInfo.tileHeight, index);

  for (let y = 0; y < tileInfo.tileHeight; y += 1) {
    for (let x = 0; x < tileInfo.tileWidth; x += 1) {
      const sampleOffset = (y * tileInfo.tileWidth + x) * components;
      const pixelOffset = ((tileInfo.top + y) * width + tileInfo.left + x) * 4;
      writePixel(tile.items, sampleOffset, components, output, pixelOffset);
    }
  }
}

async function readJpeg2000Bytes(input: ImageInput, options: ConvertToWebPOptions<WebPOutputKind>): Promise<ArrayBuffer> {
  const arrayBuffer = await toArrayBuffer(input);
  assertInputSize(arrayBuffer.byteLength, options);
  return arrayBuffer;
}

export async function decodeJpeg2000(input: ImageInput, options: ConvertToWebPOptions<WebPOutputKind> = {}): Promise<RasterImage & { components: number }> {
  throwIfAborted(options.signal);

  const [arrayBuffer, moduleNamespace] = await Promise.all([readJpeg2000Bytes(input, options), import('jpeg2000')]);
  const JpxImage = resolveJpxImage(moduleNamespace);
  if (typeof JpxImage !== 'function') {
    throw new DecodeError('The jpeg2000 package did not expose JpxImage.');
  }

  try {
    const image = new JpxImage();
    image.parse(new Uint8Array(arrayBuffer));
    throwIfAborted(options.signal);

    const width = readNumber(image.width, 'image width');
    const height = readNumber(image.height, 'image height');
    assertImageDimensions(width, height, options);

    const tiles = Array.isArray(image.tiles) ? image.tiles : [];
    if (width < 1 || height < 1 || tiles.length === 0) {
      throw new DecodeError('JPEG 2000 decoder returned an empty image.');
    }

    const firstTile = assertTile(tiles[0], width, height, 0);
    const components = resolveComponents(image, { ...firstTile.tile, width: firstTile.info.tileWidth, height: firstTile.info.tileHeight });
    assertSupportedComponents(components);

    const data = new Uint8Array(width * height * 4);
    for (let index = 0; index < tiles.length; index += 1) {
      const { tile, info } = index === 0 ? firstTile : assertTile(tiles[index], width, height, index);
      writeTileToRgba(tile, info, components, data, width, index);
    }

    return {
      data,
      width,
      height,
      components,
      format: 'image/jp2'
    };
  } catch (error) {
    if (error instanceof DecodeError) throw error;
    throw new DecodeError('JPEG 2000 decoding failed.', error);
  }
}
