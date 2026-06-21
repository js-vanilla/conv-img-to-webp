import { describe, expect, it, vi } from 'vitest';

vi.mock('jpeg2000', () => ({
  JpxImage: class {
    parse() {
      this.width = 2;
      this.height = 1;
      this.componentsCount = 2;
      this.tiles = [
        {
          left: 0,
          top: 0,
          width: 2,
          height: 1,
          items: new Uint8Array([10, 64, 20, 128])
        }
      ];
    }
  }
}));

const { decodeJpeg2000 } = await import('../src/decoders/jpeg2000.js');

describe('JPEG 2000 component contract', () => {
  it('maps two-component grayscale+alpha images to RGBA correctly', async () => {
    await expect(decodeJpeg2000(new Uint8Array([0xff, 0x4f, 0xff, 0x51]))).resolves.toMatchObject({
      width: 2,
      height: 1,
      components: 2,
      data: new Uint8Array([10, 10, 10, 64, 20, 20, 20, 128])
    });
  });
});
