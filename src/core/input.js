const DATA_URL_RE = /^data:([^;,]+)?(?:;[^,]*)?,/i;

function isArrayBufferView(value) {
  return ArrayBuffer.isView(value);
}

function viewToArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new TypeError('Invalid data URL input.');
  const header = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  const isBase64 = /;base64/i.test(header);
  const binary = isBase64 ? atob(body) : decodeURIComponent(body);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function getMimeHint(input) {
  if (input && typeof input === 'object' && 'type' in input && typeof input.type === 'string') {
    return input.type || undefined;
  }
  if (typeof input === 'string') {
    const match = input.match(DATA_URL_RE);
    if (match && match[1]) return match[1].toLowerCase();
  }
  return undefined;
}

export async function toArrayBuffer(input) {
  if (input instanceof ArrayBuffer) return input.slice(0);
  if (isArrayBufferView(input)) return viewToArrayBuffer(input);
  if (typeof Blob !== 'undefined' && input instanceof Blob) return input.arrayBuffer();
  if (typeof input === 'string' && DATA_URL_RE.test(input)) return dataUrlToBytes(input).buffer;
  throw new TypeError('Expected a Blob, File, ArrayBuffer, TypedArray, DataView, or data URL string.');
}

export async function toBlob(input, fallbackMime = 'application/octet-stream') {
  if (typeof Blob === 'undefined') {
    throw new TypeError('Blob is not available in this JavaScript environment.');
  }
  if (input instanceof Blob) return input;
  const arrayBuffer = await toArrayBuffer(input);
  return new Blob([arrayBuffer], { type: fallbackMime });
}
