import { describe, expect, it, vi } from 'vitest';

vi.mock('utif2', () => ({
  default: {
    decode(buffer) {
      const first = new Uint8Array(buffer)[0];
      if (first === 0xff) throw new Error('corrupt tiff');
      if (first === 0x01) return [{ width: 2, height: 2 }];
      return [{ width: 1, height: 1 }, { width: 1, height: 1 }];
    },
    decodeImage() {},
    toRGBA8(ifd) {
      return new Uint8Array(ifd.width * ifd.height * 4).fill(255);
    }
  }
}));

const { decodeTiff, getTiffPageCount } = await import('../src/decoders/tiff.js');

describe('TIFF page contract', () => {
  it('throws when a multi-page TIFF is decoded without an explicit page', async () => {
    await expect(decodeTiff(new Uint8Array([0x49, 0x49, 0x2a, 0x00]))).rejects.toMatchObject({ code: 'TIFF_PAGE_REQUIRED' });
  });

  it('decodes when the zero-based page is explicit', async () => {
    await expect(decodeTiff(new Uint8Array([0x49, 0x49, 0x2a, 0x00]), { page: 1 })).resolves.toMatchObject({ page: 1, pageCount: 2 });
  });

  it('counts TIFF pages with decoder errors wrapped as DecodeError', async () => {
    await expect(getTiffPageCount(new Uint8Array([0xff]))).rejects.toMatchObject({ code: 'DECODE_ERROR' });
  });

  it('applies decoded dimension limits before RGBA buffers are accepted', async () => {
    await expect(decodeTiff(new Uint8Array([0x01]), { maxPixels: 1 })).rejects.toMatchObject({ code: 'DECODE_ERROR' });
  });
});
