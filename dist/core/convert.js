var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { assertInputSize, throwIfAborted } from './assert.js';
import { rasterToCanvas } from './canvas.js';
import { detectImageType, ImageType, isJpeg2000, isTiff, normalizeMimeType } from './detect.js';
import { DecodeError, UnsupportedFormatError } from './errors.js';
import { getMimeHint, toArrayBuffer } from './input.js';
import { decodeNativeToCanvas } from '../decoders/native.js';
import { encodeCanvasToWebP } from '../encoder/webp.js';
function isLibraryError(error) {
    return Boolean(error && typeof error === 'object' && 'code' in error && error.code);
}
function isNativeBrowserType(type) {
    return type === ImageType.JPEG || type === ImageType.PNG || type === ImageType.GIF;
}
function readInputBytes(input, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const arrayBuffer = yield toArrayBuffer(input);
            assertInputSize(arrayBuffer.byteLength, options);
            return arrayBuffer;
        }
        catch (error) {
            if (isLibraryError(error) && (error.code === 'ABORTED' || error.code === 'DECODE_ERROR'))
                throw error;
            if (error instanceof TypeError)
                throw error;
            throw new DecodeError('Failed to read image input.', error);
        }
    });
}
function decodeToCanvas(input, options) {
    return __awaiter(this, void 0, void 0, function* () {
        throwIfAborted(options.signal);
        const mimeHint = normalizeMimeType(options.mimeType || getMimeHint(input));
        const arrayBuffer = yield readInputBytes(input, options);
        throwIfAborted(options.signal);
        const header = new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, 64));
        const type = detectImageType(header, normalizeMimeType(options.type) || mimeHint);
        if (!type) {
            throw new UnsupportedFormatError('Could not detect image type. Supported input formats are JPG/JPEG, JPEG 2000/JP2/J2K, GIF, PNG, and TIFF.');
        }
        if (isNativeBrowserType(type)) {
            return {
                canvas: yield decodeNativeToCanvas(arrayBuffer, type, options),
                type
            };
        }
        if (isTiff(type)) {
            const { decodeTiff } = yield import('../decoders/tiff.js');
            const raster = yield decodeTiff(arrayBuffer, options);
            return {
                canvas: rasterToCanvas(raster, options),
                type,
                meta: { page: raster.page, pageCount: raster.pageCount }
            };
        }
        if (isJpeg2000(type)) {
            const { decodeJpeg2000 } = yield import('../decoders/jpeg2000.js');
            const raster = yield decodeJpeg2000(arrayBuffer, options);
            return {
                canvas: rasterToCanvas(raster, options),
                type,
                meta: { components: raster.components }
            };
        }
        throw new UnsupportedFormatError(`Unsupported image type: ${type}.`);
    });
}
export function convertToWebP(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, options = {}) {
        const decoded = yield decodeToCanvas(input, options);
        throwIfAborted(options.signal);
        return encodeCanvasToWebP(decoded.canvas, options);
    });
}
export function convertToWebPWithMetadata(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, options = {}) {
        const decoded = yield decodeToCanvas(input, options);
        throwIfAborted(options.signal);
        const output = yield encodeCanvasToWebP(decoded.canvas, options);
        return {
            output,
            inputType: decoded.type,
            metadata: decoded.meta || {}
        };
    });
}
//# sourceMappingURL=convert.js.map