import { AbortConversionError, DecodeError } from './errors.js';
export const DEFAULT_LIMITS = Object.freeze({
    maxInputBytes: 100 * 1024 * 1024,
    maxPixels: 50000000,
    maxWidth: 20000,
    maxHeight: 20000
});
function resolveLimit(options, name) {
    const configured = options === null || options === void 0 ? void 0 : options[name];
    if (configured === undefined || configured === null)
        return DEFAULT_LIMITS[name];
    const value = Number(configured);
    if (!Number.isFinite(value) || value < 1) {
        throw new DecodeError(`Invalid ${name} option: ${String(configured)}. Expected a positive finite number.`);
    }
    return Math.floor(value);
}
export function throwIfAborted(signal) {
    if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
        throw new AbortConversionError();
    }
}
export function clampQuality(quality) {
    if (quality === undefined || quality === null)
        return 0.92;
    const value = Number(quality);
    if (!Number.isFinite(value))
        return 0.92;
    return Math.min(1, Math.max(0, value));
}
export function assertInputSize(byteLength, options = {}) {
    const maxInputBytes = resolveLimit(options, 'maxInputBytes');
    if (!Number.isSafeInteger(byteLength) || byteLength < 0) {
        throw new DecodeError(`Invalid input byte length: ${byteLength}.`);
    }
    if (byteLength > maxInputBytes) {
        throw new DecodeError(`Input is too large: ${byteLength} bytes exceeds maxInputBytes ${maxInputBytes}.`);
    }
}
export function assertPositiveDimensions(width, height) {
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
        throw new DecodeError(`Invalid image dimensions: ${width}x${height}.`);
    }
}
export function assertImageDimensions(width, height, options = {}) {
    assertPositiveDimensions(width, height);
    const maxWidth = resolveLimit(options, 'maxWidth');
    const maxHeight = resolveLimit(options, 'maxHeight');
    const maxPixels = resolveLimit(options, 'maxPixels');
    const pixels = width * height;
    if (!Number.isSafeInteger(pixels)) {
        throw new DecodeError(`Image dimensions overflow safe integer range: ${width}x${height}.`);
    }
    if (width > maxWidth) {
        throw new DecodeError(`Image width ${width} exceeds maxWidth ${maxWidth}.`);
    }
    if (height > maxHeight) {
        throw new DecodeError(`Image height ${height} exceeds maxHeight ${maxHeight}.`);
    }
    if (pixels > maxPixels) {
        throw new DecodeError(`Image has ${pixels} pixels, exceeding maxPixels ${maxPixels}.`);
    }
}
export function assertRgbaBufferLength(data, width, height) {
    const expected = width * height * 4;
    if (!data || data.byteLength !== expected) {
        const received = data && Number.isFinite(data.byteLength) ? data.byteLength : 0;
        throw new DecodeError(`Invalid RGBA buffer length: expected ${expected} bytes for ${width}x${height}, received ${received}.`);
    }
}
//# sourceMappingURL=assert.js.map