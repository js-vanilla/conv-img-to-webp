var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { assertImageDimensions, assertInputSize, assertRgbaBufferLength, throwIfAborted } from '../core/assert.js';
import { DecodeError, InvalidPageError, MissingPageError } from '../core/errors.js';
import { toArrayBuffer } from '../core/input.js';
function resolveUTIF(moduleNamespace) {
    const namespace = moduleNamespace;
    return (namespace.default || namespace.UTIF || moduleNamespace);
}
function assertPage(page, pageCount) {
    if (!Number.isInteger(page)) {
        throw new InvalidPageError(`TIFF page must be a zero-based integer. Received: ${String(page)}.`);
    }
    if (page < 0 || page >= pageCount) {
        throw new InvalidPageError(`TIFF page ${String(page)} is out of range. Page count is ${pageCount}.`);
    }
}
function readDimension(value, name) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
        throw new DecodeError(`TIFF decoder returned an invalid ${name}: ${String(value)}.`);
    }
    return value;
}
function readTiffBytes(input, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const arrayBuffer = yield toArrayBuffer(input);
        assertInputSize(arrayBuffer.byteLength, options);
        return arrayBuffer;
    });
}
function toUint8Buffer(rgba) {
    if (rgba instanceof Uint8Array)
        return rgba;
    if (rgba instanceof Uint8ClampedArray)
        return new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength);
    if (rgba instanceof ArrayBuffer)
        return new Uint8Array(rgba);
    return Uint8Array.from(rgba);
}
export function getTiffPageCount(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, options = {}) {
        throwIfAborted(options.signal);
        const [arrayBuffer, moduleNamespace] = yield Promise.all([readTiffBytes(input, options), import('utif2')]);
        const UTIF = resolveUTIF(moduleNamespace);
        try {
            const ifds = UTIF.decode(arrayBuffer);
            if (!Array.isArray(ifds))
                throw new DecodeError('TIFF decoder returned an invalid page list.');
            return ifds.length;
        }
        catch (error) {
            if (error instanceof DecodeError)
                throw error;
            throw new DecodeError('Failed to count TIFF pages.', error);
        }
    });
}
export function decodeTiff(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, options = {}) {
        throwIfAborted(options.signal);
        const [arrayBuffer, moduleNamespace] = yield Promise.all([readTiffBytes(input, options), import('utif2')]);
        const UTIF = resolveUTIF(moduleNamespace);
        try {
            const ifds = UTIF.decode(arrayBuffer);
            if (!Array.isArray(ifds))
                throw new DecodeError('TIFF decoder returned an invalid page list.');
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
            if (!ifd)
                throw new DecodeError(`TIFF page ${page} is missing.`);
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
        }
        catch (error) {
            if (error instanceof MissingPageError || error instanceof InvalidPageError || error instanceof DecodeError)
                throw error;
            throw new DecodeError('TIFF decoding failed.', error);
        }
    });
}
//# sourceMappingURL=tiff.js.map