var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const DATA_URL_RE = /^data:([^;,]+)?(?:;[^,]*)?,/i;
const HEX_RE = /^[0-9a-fA-F]{2}$/;
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
function isArrayBufferView(value) {
    return ArrayBuffer.isView(value);
}
function viewToArrayBuffer(view) {
    const out = new Uint8Array(view.byteLength);
    out.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    return out.buffer;
}
function decodeBase64ToBytes(input) {
    const clean = input.replace(/\s+/g, '');
    if (clean.length % 4 === 1 || !BASE64_RE.test(clean)) {
        throw new TypeError('Invalid base64 data URL input.');
    }
    if (typeof atob !== 'function') {
        throw new TypeError('Base64 data URL decoding requires atob in this JavaScript environment.');
    }
    const binary = atob(clean);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1)
        out[i] = binary.charCodeAt(i) & 0xff;
    return out;
}
function appendUtf8CodePoint(bytes, codePoint) {
    if (codePoint <= 0x7f) {
        bytes.push(codePoint);
    }
    else if (codePoint <= 0x7ff) {
        bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    }
    else if (codePoint <= 0xffff) {
        bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    }
    else {
        bytes.push(0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 0x3f), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    }
}
function decodePercentEncodedBytes(input) {
    const bytes = [];
    for (let i = 0; i < input.length; i += 1) {
        const char = input[i];
        if (char === '%') {
            const hex = input.slice(i + 1, i + 3);
            if (!HEX_RE.test(hex))
                throw new TypeError('Invalid percent-encoded data URL input.');
            bytes.push(Number.parseInt(hex, 16));
            i += 2;
            continue;
        }
        const codePoint = input.codePointAt(i);
        if (codePoint === undefined)
            continue;
        appendUtf8CodePoint(bytes, codePoint);
        if (codePoint > 0xffff)
            i += 1;
    }
    return Uint8Array.from(bytes);
}
function dataUrlToBytes(dataUrl) {
    const comma = dataUrl.indexOf(',');
    if (comma < 0)
        throw new TypeError('Invalid data URL input.');
    const header = dataUrl.slice(0, comma);
    const body = dataUrl.slice(comma + 1);
    return /;base64/i.test(header) ? decodeBase64ToBytes(body) : decodePercentEncodedBytes(body);
}
export function getMimeHint(input) {
    if (input && typeof input === 'object' && 'type' in input && typeof input.type === 'string') {
        return input.type || undefined;
    }
    if (typeof input === 'string') {
        const match = input.match(DATA_URL_RE);
        if (match === null || match === void 0 ? void 0 : match[1])
            return match[1].toLowerCase();
    }
    return undefined;
}
export function toArrayBuffer(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (input instanceof ArrayBuffer)
            return input.slice(0);
        if (isArrayBufferView(input))
            return viewToArrayBuffer(input);
        if (typeof Blob !== 'undefined' && input instanceof Blob)
            return input.arrayBuffer();
        if (typeof input === 'string' && DATA_URL_RE.test(input))
            return dataUrlToBytes(input).buffer;
        throw new TypeError('Expected a Blob, File, ArrayBuffer, TypedArray, DataView, or data URL string.');
    });
}
export function toBlob(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, fallbackMime = 'application/octet-stream') {
        if (typeof Blob === 'undefined') {
            throw new TypeError('Blob is not available in this JavaScript environment.');
        }
        if (input instanceof Blob)
            return input;
        const arrayBuffer = yield toArrayBuffer(input);
        return new Blob([arrayBuffer], { type: fallbackMime });
    });
}
//# sourceMappingURL=input.js.map