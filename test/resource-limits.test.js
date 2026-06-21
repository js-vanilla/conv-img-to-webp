import { describe, expect, it } from 'vitest';
import { assertImageDimensions, assertInputSize, assertRgbaBufferLength } from '../src/core/assert.js';

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
});
