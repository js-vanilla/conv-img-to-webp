import { clampQuality } from '../core/assert.js';
import { EncodeError } from '../core/errors.js';

async function canvasToBlob(canvas, quality) {
  try {
    if (canvas && typeof canvas.convertToBlob === 'function') {
      return await canvas.convertToBlob({ type: 'image/webp', quality });
    }

    if (canvas && typeof canvas.toBlob === 'function') {
      return await new Promise((resolve, reject) => {
        try {
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new EncodeError('Canvas returned an empty WebP blob.'));
          }, 'image/webp', quality);
        } catch (error) {
          reject(new EncodeError('Canvas WebP encoding failed.', error));
        }
      });
    }
  } catch (error) {
    if (error instanceof EncodeError) throw error;
    throw new EncodeError('Canvas WebP encoding failed.', error);
  }

  throw new EncodeError('The canvas implementation does not support Blob encoding.');
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
    } catch (error) {
      reject(new EncodeError('Failed to read encoded WebP blob.', error));
    }
  });
}

async function blobToArrayBuffer(blob) {
  try {
    return await blob.arrayBuffer();
  } catch (error) {
    throw new EncodeError('Failed to read encoded WebP blob as ArrayBuffer.', error);
  }
}

export async function encodeCanvasToWebP(canvas, options = {}) {
  const quality = clampQuality(options.quality);
  const blob = await canvasToBlob(canvas, quality);

  if (blob.type && blob.type.toLowerCase() !== 'image/webp') {
    throw new EncodeError('This browser does not support canvas WebP encoding.');
  }

  const output = options.output || 'blob';
  if (output === 'blob') return blob;
  if (output === 'arrayBuffer') return blobToArrayBuffer(blob);
  if (output === 'dataURL') return blobToDataURL(blob);
  throw new TypeError(`Unsupported output option: ${output}. Use "blob", "arrayBuffer", or "dataURL".`);
}
