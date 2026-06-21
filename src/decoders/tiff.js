import { throwIfAborted } from '../core/assert.js';
import { DecodeError, InvalidPageError, MissingPageError } from '../core/errors.js';
import { toArrayBuffer } from '../core/input.js';

function resolveUTIF(moduleNamespace) {
  return moduleNamespace.default || moduleNamespace.UTIF || moduleNamespace;
}

function assertPage(page, pageCount) {
  if (!Number.isInteger(page)) {
    throw new InvalidPageError(`TIFF page must be a zero-based integer. Received: ${page}.`);
  }
  if (page < 0 || page >= pageCount) {
    throw new InvalidPageError(`TIFF page ${page} is out of range. Page count is ${pageCount}.`);
  }
}

export async function getTiffPageCount(input) {
  const [arrayBuffer, moduleNamespace] = await Promise.all([toArrayBuffer(input), import('utif2')]);
  const UTIF = resolveUTIF(moduleNamespace);
  const ifds = UTIF.decode(arrayBuffer);
  return ifds.length;
}

export async function decodeTiff(input, options = {}) {
  throwIfAborted(options.signal);

  const [arrayBuffer, moduleNamespace] = await Promise.all([toArrayBuffer(input), import('utif2')]);
  const UTIF = resolveUTIF(moduleNamespace);

  try {
    const ifds = UTIF.decode(arrayBuffer);
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
    UTIF.decodeImage(arrayBuffer, ifd, ifds);
    throwIfAborted(options.signal);

    const rgba = UTIF.toRGBA8(ifd);
    if (!rgba || !ifd.width || !ifd.height) {
      throw new DecodeError(`Failed to decode TIFF page ${page}.`);
    }

    return {
      data: rgba instanceof Uint8Array ? rgba : new Uint8Array(rgba),
      width: ifd.width,
      height: ifd.height,
      page,
      pageCount,
      format: 'image/tiff'
    };
  } catch (error) {
    if (error instanceof MissingPageError || error instanceof InvalidPageError || error instanceof DecodeError) throw error;
    throw new DecodeError('TIFF decoding failed.', error);
  }
}
