import { describe, expect, it, vi } from 'vitest';

vi.mock('utif2', () => ({
  default: {
    decode() {
      return [{ width: 1, height: 1 }, { width: 1, height: 1 }];
    },
    decodeImage() {},
    toRGBA8() {
      return new Uint8Array([0, 0, 0, 255]);
    }
  }
}));

const { decodeTiff } = await import('../src/decoders/tiff.js');

describe('TIFF page contract', () => {
  it('throws when a multi-page TIFF is decoded without an explicit page', async () => {
    await expect(decodeTiff(new Uint8Array([0x49, 0x49, 0x2a, 0x00]))).rejects.toMatchObject({ code: 'TIFF_PAGE_REQUIRED' });
  });

  it('decodes when the zero-based page is explicit', async () => {
    await expect(decodeTiff(new Uint8Array([0x49, 0x49, 0x2a, 0x00]), { page: 1 })).resolves.toMatchObject({ page: 1, pageCount: 2 });
  });
});
