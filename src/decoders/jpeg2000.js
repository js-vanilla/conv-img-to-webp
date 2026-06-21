import { throwIfAborted } from '../core/assert.js';
import { DecodeError } from '../core/errors.js';
import { toArrayBuffer } from '../core/input.js';

function resolveJpxImage(moduleNamespace) {
  return moduleNamespace.JpxImage || (moduleNamespace.default && moduleNamespace.default.JpxImage) || moduleNamespace.default;
}

function packedToRgba(items, components, width, height) {
  const pixelCount = width * height;
  const rgba = new Uint8Array(pixelCount * 4);

  if (components === 1) {
    for (let i = 0, j = 0; i < pixelCount; i += 1, j += 4) {
      const v = items[i];
      rgba[j] = v;
      rgba[j + 1] = v;
      rgba[j + 2] = v;
      rgba[j + 3] = 255;
    }
    return rgba;
  }

  if (components === 2) {
    for (let i = 0, j = 0, k = 0; i < pixelCount; i += 1, j += 2, k += 4) {
      const v = items[j];
      rgba[k] = v;
      rgba[k + 1] = v;
      rgba[k + 2] = v;
      rgba[k + 3] = items[j + 1];
    }
    return rgba;
  }

  for (let i = 0, j = 0, k = 0; i < pixelCount; i += 1, j += components, k += 4) {
    rgba[k] = items[j];
    rgba[k + 1] = items[j + 1];
    rgba[k + 2] = items[j + 2];
    rgba[k + 3] = components > 3 ? items[j + 3] : 255;
  }
  return rgba;
}

function tileToRgba(tile, components, width, height) {
  if (!tile || !tile.items) throw new DecodeError('JPEG 2000 decoder returned no tile pixel data.');
  if (tile.width === width && tile.height === height) {
    return packedToRgba(tile.items, components, width, height);
  }

  const rgba = new Uint8Array(width * height * 4);
  const source = packedToRgba(tile.items, components, tile.width, tile.height);
  for (let y = 0; y < tile.height; y += 1) {
    const src = y * tile.width * 4;
    const dst = ((tile.top + y) * width + tile.left) * 4;
    rgba.set(source.subarray(src, src + tile.width * 4), dst);
  }
  return rgba;
}

export async function decodeJpeg2000(input, options = {}) {
  throwIfAborted(options.signal);

  const [arrayBuffer, moduleNamespace] = await Promise.all([toArrayBuffer(input), import('jpeg2000')]);
  const JpxImage = resolveJpxImage(moduleNamespace);
  if (typeof JpxImage !== 'function') {
    throw new DecodeError('The jpeg2000 package did not expose JpxImage.');
  }

  try {
    const image = new JpxImage();
    image.parse(new Uint8Array(arrayBuffer));
    throwIfAborted(options.signal);

    const width = image.width;
    const height = image.height;
    const components = image.componentsCount || 4;
    const tiles = image.tiles || [];

    if (!width || !height || tiles.length === 0) {
      throw new DecodeError('JPEG 2000 decoder returned an empty image.');
    }

    let data;
    if (tiles.length === 1) {
      data = tileToRgba(tiles[0], components, width, height);
    } else {
      data = new Uint8Array(width * height * 4);
      for (const tile of tiles) {
        const tileRgba = tileToRgba(tile, components, width, height);
        for (let y = 0; y < tile.height; y += 1) {
          const src = ((tile.top + y) * width + tile.left) * 4;
          data.set(tileRgba.subarray(src, src + tile.width * 4), src);
        }
      }
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
