const JPEG = 'image/jpeg';
const PNG = 'image/png';
const GIF = 'image/gif';
const TIFF = 'image/tiff';
const JP2 = 'image/jp2';
const J2K = 'image/j2k';

function ascii(bytes, start, end) {
  let out = '';
  for (let i = start; i < end && i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
}

export function normalizeMimeType(mime) {
  if (!mime) return undefined;
  const clean = String(mime).split(';')[0].trim().toLowerCase();
  if (clean === 'image/jpg' || clean === 'image/pjpeg') return JPEG;
  if (clean === 'image/x-png') return PNG;
  if (clean === 'image/tif' || clean === 'image/x-tiff') return TIFF;
  if (clean === 'image/jpeg2000' || clean === 'image/jpx' || clean === 'image/jpm') return JP2;
  if (clean === 'image/x-jp2') return JP2;
  return clean || undefined;
}

export function detectImageType(bytesOrBuffer, mimeHint) {
  const hinted = normalizeMimeType(mimeHint);
  const bytes = bytesOrBuffer instanceof Uint8Array ? bytesOrBuffer : new Uint8Array(bytesOrBuffer || []);

  if (bytes.length >= 12 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00 && bytes[3] === 0x0c && ascii(bytes, 4, 12) === 'jP  \r\n\x87\n') return JP2;
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0x4f && bytes[2] === 0xff && bytes[3] === 0x51) return J2K;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return JPEG;
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 4) === 'PNG' && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return PNG;
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a')) return GIF;
  if (bytes.length >= 4 && ((bytes[0] === 0x49 && bytes[1] === 0x49 && (bytes[2] === 0x2a || bytes[2] === 0x2b) && bytes[3] === 0x00) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && (bytes[3] === 0x2a || bytes[3] === 0x2b)))) return TIFF;

  if (hinted === JPEG || hinted === PNG || hinted === GIF || hinted === TIFF || hinted === JP2 || hinted === J2K) return hinted;
  return undefined;
}

export function isTiff(type) {
  return normalizeMimeType(type) === TIFF;
}

export function isJpeg2000(type) {
  const normalized = normalizeMimeType(type);
  return normalized === JP2 || normalized === J2K;
}

export const ImageType = Object.freeze({
  JPEG,
  PNG,
  GIF,
  TIFF,
  JP2,
  J2K
});
