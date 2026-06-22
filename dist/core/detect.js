const JPEG = 'image/jpeg';
const PNG = 'image/png';
const GIF = 'image/gif';
const TIFF = 'image/tiff';
const JP2 = 'image/jp2';
const J2K = 'image/j2k';
const JP2_SIGNATURE = [0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a];
const PNG_SIGNATURE = [0x50, 0x4e, 0x47];
const GIF87A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
const GIF89A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
const WEBP_FEATURE_TEST_IMAGES = Object.freeze({
    lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
    alpha: 'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
    animation: 'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA'
});
function matches(bytes, offset, signature) {
    if (bytes.length < offset + signature.length)
        return false;
    for (let i = 0; i < signature.length; i += 1) {
        if (bytes[offset + i] !== signature[i])
            return false;
    }
    return true;
}
function toBytes(bytesOrBuffer) {
    if (bytesOrBuffer instanceof Uint8Array)
        return bytesOrBuffer;
    if (bytesOrBuffer instanceof ArrayBuffer)
        return new Uint8Array(bytesOrBuffer);
    if (bytesOrBuffer && ArrayBuffer.isView(bytesOrBuffer)) {
        return new Uint8Array(bytesOrBuffer.buffer, bytesOrBuffer.byteOffset, bytesOrBuffer.byteLength);
    }
    return new Uint8Array(0);
}
function isKnownImageType(type) {
    return type === JPEG || type === PNG || type === GIF || type === TIFF || type === JP2 || type === J2K;
}
function runWebPFeatureCheck(feature) {
    const testImage = WEBP_FEATURE_TEST_IMAGES[feature];
    if (!testImage)
        return Promise.reject(new TypeError(`Unsupported WebP feature: ${String(feature)}.`));
    return new Promise(resolve => {
        if (typeof Image === 'undefined') {
            Promise.resolve().then(() => resolve(false));
            return;
        }
        let img = new Image();
        const cleanup = () => {
            if (!img)
                return;
            img.onload = null;
            img.onerror = null;
            img = undefined;
        };
        img.onload = () => {
            const result = Boolean(img && img.width > 0 && img.height > 0);
            cleanup();
            resolve(result);
        };
        img.onerror = () => {
            cleanup();
            resolve(false);
        };
        img.src = `data:image/webp;base64,${testImage}`;
    });
}
export function normalizeMimeType(mime) {
    var _a;
    if (!mime)
        return undefined;
    const clean = (_a = String(mime).split(';')[0]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (!clean)
        return undefined;
    if (clean === 'image/jpg' || clean === 'image/pjpeg')
        return JPEG;
    if (clean === 'image/x-png')
        return PNG;
    if (clean === 'image/tif' || clean === 'image/x-tiff')
        return TIFF;
    if (clean === 'image/jpeg2000' || clean === 'image/jp2' || clean === 'image/x-jp2' || clean === 'image/jpx' || clean === 'image/jpm')
        return JP2;
    if (clean === 'image/j2k' || clean === 'image/x-j2k' || clean === 'image/jpc' || clean === 'image/x-jpc')
        return J2K;
    return clean;
}
export function detectImageType(bytesOrBuffer, mimeHint) {
    const hinted = normalizeMimeType(mimeHint);
    const bytes = toBytes(bytesOrBuffer);
    if (bytes.length >= 12 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00 && bytes[3] === 0x0c && matches(bytes, 4, JP2_SIGNATURE))
        return JP2;
    if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0x4f && bytes[2] === 0xff && bytes[3] === 0x51)
        return J2K;
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
        return JPEG;
    if (bytes.length >= 8 && bytes[0] === 0x89 && matches(bytes, 1, PNG_SIGNATURE) && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a)
        return PNG;
    if (matches(bytes, 0, GIF87A_SIGNATURE) || matches(bytes, 0, GIF89A_SIGNATURE))
        return GIF;
    if (bytes.length >= 4 && ((bytes[0] === 0x49 && bytes[1] === 0x49 && (bytes[2] === 0x2a || bytes[2] === 0x2b) && bytes[3] === 0x00) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && (bytes[3] === 0x2a || bytes[3] === 0x2b))))
        return TIFF;
    return isKnownImageType(hinted) ? hinted : undefined;
}
export function isTiff(type) {
    return normalizeMimeType(type) === TIFF;
}
export function isJpeg2000(type) {
    const normalized = normalizeMimeType(type);
    return normalized === JP2 || normalized === J2K;
}
export function checkWebPFeature(feature, callback) {
    const result = runWebPFeatureCheck(feature);
    if (!callback)
        return result;
    result.then(supported => callback(feature, supported), () => callback(feature, false));
}
export const check_webp_feature = checkWebPFeature;
export const ImageType = Object.freeze({
    JPEG,
    PNG,
    GIF,
    TIFF,
    JP2,
    J2K
});
//# sourceMappingURL=detect.js.map