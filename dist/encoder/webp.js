var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { clampQuality } from '../core/assert.js';
import { EncodeError } from '../core/errors.js';
function canvasToBlob(canvas, quality) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if ('convertToBlob' in canvas && typeof canvas.convertToBlob === 'function') {
                return yield canvas.convertToBlob({ type: 'image/webp', quality });
            }
            if ('toBlob' in canvas && typeof canvas.toBlob === 'function') {
                return yield new Promise((resolve, reject) => {
                    try {
                        canvas.toBlob(blob => {
                            if (blob)
                                resolve(blob);
                            else
                                reject(new EncodeError('Canvas returned an empty WebP blob.'));
                        }, 'image/webp', quality);
                    }
                    catch (error) {
                        reject(new EncodeError('Canvas WebP encoding failed.', error));
                    }
                });
            }
        }
        catch (error) {
            if (error instanceof EncodeError)
                throw error;
            throw new EncodeError('Canvas WebP encoding failed.', error);
        }
        throw new EncodeError('The canvas implementation does not support Blob encoding.');
    });
}
function blobToDataURL(blob) {
    if (typeof FileReader === 'undefined') {
        throw new EncodeError('FileReader is not available for dataURL output in this JavaScript environment.');
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new EncodeError('Failed to read encoded WebP blob.'));
        reader.onload = () => resolve(String(reader.result));
        try {
            reader.readAsDataURL(blob);
        }
        catch (error) {
            reject(new EncodeError('Failed to read encoded WebP blob.', error));
        }
    });
}
function blobToArrayBuffer(blob) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield blob.arrayBuffer();
        }
        catch (error) {
            throw new EncodeError('Failed to read encoded WebP blob as ArrayBuffer.', error);
        }
    });
}
export function encodeCanvasToWebP(canvas_1) {
    return __awaiter(this, arguments, void 0, function* (canvas, options = {}) {
        const quality = clampQuality(options.quality);
        const blob = yield canvasToBlob(canvas, quality);
        if (blob.type && blob.type.toLowerCase() !== 'image/webp') {
            throw new EncodeError('This browser does not support canvas WebP encoding.');
        }
        const output = options.output || 'blob';
        if (output === 'blob')
            return blob;
        if (output === 'arrayBuffer')
            return yield blobToArrayBuffer(blob);
        if (output === 'dataURL')
            return yield blobToDataURL(blob);
        throw new TypeError(`Unsupported output option: ${String(output)}. Use "blob", "arrayBuffer", or "dataURL".`);
    });
}
//# sourceMappingURL=webp.js.map