import { describe, expect, it } from 'vitest';
import { assertImageDimensions, assertInputSize, assertRgbaBufferLength } from '../src/core/assert.js';
import { toArrayBuffer } from '../src/core/input.js';

describe('resource limit guards', () => {
  it('rejects oversized inputs before decode', () => {
    expect(() => assertInputSize(11, { maxInputBytes: 10 })).toThrow(/Input is too large/);
  });

  it('rejects dimensions above configured pixel limits', () => {
    expect(() => assertImageDimensions(10, 10, { maxPixels: 99 })).toThrow(/exceeding maxPixels/);
  });

  it('rejects malformed RGBA buffers', () => {
    expect(() => assertRgbaBufferLength(new Uint8Array(3), 1, 1)).toThrow(/Invalid RGBA buffer length/);
  });

  it('decodes percent-encoded data URLs as bytes, not UTF-16 char codes', async () => {
    const bytes = new Uint8Array(await toArrayBuffer('data:application/octet-stream,%89PNG%0D%0A'));
    expect([...bytes]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  });

  it('rejects malformed base64 data URLs', async () => {
    await expect(toArrayBuffer('data:image/png;base64,abcde')).rejects.toThrow(/Invalid base64/);
  });
});
