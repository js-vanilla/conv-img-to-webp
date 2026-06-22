var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { assertImageDimensions, throwIfAborted } from '../core/assert.js';
import { closeBitmap, createCanvas, get2dContext } from '../core/canvas.js';
import { DecodeError } from '../core/errors.js';
import { toBlob } from '../core/input.js';
function isLibraryDecodeError(error) {
    return Boolean(error && typeof error === 'object' && 'code' in error && (error.code === 'ABORTED' || error.code === 'DECODE_ERROR'));
}
function dimensionsOf(bitmap) {
    if ('naturalWidth' in bitmap) {
        return {
            width: bitmap.naturalWidth || bitmap.width || 0,
            height: bitmap.naturalHeight || bitmap.height || 0
        };
    }
    return { width: bitmap.width, height: bitmap.height };
}
export function decodeNativeToCanvas(input_1, mimeType_1) {
    return __awaiter(this, arguments, void 0, function* (input, mimeType, options = {}) {
        throwIfAborted(options.signal);
        const blob = yield toBlob(input, mimeType);
        let bitmap;
        try {
            if (typeof createImageBitmap === 'function') {
                bitmap = yield createImageBitmap(blob, {
                    imageOrientation: options.imageOrientation || 'from-image',
                    colorSpaceConversion: options.colorSpaceConversion || 'default',
                    premultiplyAlpha: 'default'
                });
            }
            else if (typeof Image !== 'undefined' && typeof URL !== 'undefined') {
                bitmap = yield loadHtmlImage(blob);
            }
            else {
                throw new DecodeError('No native browser image decoder is available.');
            }
            throwIfAborted(options.signal);
            const { width, height } = dimensionsOf(bitmap);
            assertImageDimensions(width, height, options);
            const canvas = createCanvas(width, height, options.canvasFactory, options);
            const ctx = get2dContext(canvas, { willReadFrequently: false });
            ctx.drawImage(bitmap, 0, 0);
            return canvas;
        }
        catch (error) {
            if (isLibraryDecodeError(error))
                throw error;
            throw new DecodeError(`Native browser decoding failed for ${mimeType}.`, error);
        }
        finally {
            closeBitmap(bitmap);
        }
    });
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
//# sourceMappingURL=native.js.map