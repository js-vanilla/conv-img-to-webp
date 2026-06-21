import { assertImageDimensions, assertInputSize, throwIfAborted } from '../core/assert.js';
import { DecodeError } from '../core/errors.js';
import { toArrayBuffer } from '../core/input.js';

function resolveJpxImage(moduleNamespace) {
  return moduleNamespace.JpxImage || (moduleNamespace.default && moduleNamespace.default.JpxImage) || moduleNamespace.default;
}

function readNumber(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DecodeError(`JPEG 2000 decoder returned an invalid ${name}: ${value}.`);
  }
  return value;
}

function resolveComponents(image, tile) {
  const metadataComponents = image.componentsCount ?? image.components?.length ?? image.components?.count;
  if (Number.isInteger(metadataComponents) && metadataComponents >= 1 && metadataComponents <= 4) {
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

function assertSupportedComponents(components) {
  if (!Number.isInteger(components) || components < 1 || components > 4) {
    throw new DecodeError(`Unsupported JPEG 2000 component count: ${components}. Only grayscale, grayscale+alpha, RGB, and RGBA are supported.`);
  }
}

function assertTile(tile, width, height, index) {
  if (!tile || !tile.items || typeof tile.items.length !== 'number') {
    throw new DecodeError(`JPEG 2000 tile ${index} contains no pixel data.`);
  }

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

  return { tileWidth, tileHeight, left, top };
}

function assertTileLength(tile, components, tileWidth, tileHeight, index) {
  const expected = tileWidth * tileHeight * components;
  if (tile.items.length !== expected) {
    throw new DecodeError(`JPEG 2000 tile ${index} sample length mismatch: expected ${expected}, received ${tile.items.length}.`);
  }
}

function byteSample(items, offset) {
  const value = items[offset];
  if (!Number.isFinite(value) || value < 0 || value > 255) {
    throw new DecodeError('Unsupported JPEG 2000 sample range. Only 8-bit component data is supported by this lightweight decoder path.');
  }
  return value & 0xff;
}

function writePixel(items, sampleOffset, components, output, pixelOffset) {
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

function writeTileToRgba(tile, tileInfo, components, output, width, index) {
  assertTileLength(tile, components, tileInfo.tileWidth, tileInfo.tileHeight, index);

  for (let y = 0; y < tileInfo.tileHeight; y += 1) {
    for (let x = 0; x < tileInfo.tileWidth; x += 1) {
      const sampleOffset = (y * tileInfo.tileWidth + x) * components;
      const pixelOffset = ((tileInfo.top + y) * width + tileInfo.left + x) * 4;
      writePixel(tile.items, sampleOffset, components, output, pixelOffset);
    }
  }
}

async function readJpeg2000Bytes(input, options) {
  const arrayBuffer = await toArrayBuffer(input);
  assertInputSize(arrayBuffer.byteLength, options);
  return arrayBuffer;
}

export async function decodeJpeg2000(input, options = {}) {
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

    const firstTileInfo = assertTile(tiles[0], width, height, 0);
    const components = resolveComponents(image, { ...tiles[0], ...firstTileInfo });
    assertSupportedComponents(components);

    const data = new Uint8Array(width * height * 4);
    for (let index = 0; index < tiles.length; index += 1) {
      const tileInfo = index === 0 ? firstTileInfo : assertTile(tiles[index], width, height, index);
      writeTileToRgba(tiles[index], tileInfo, components, data, width, index);
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
