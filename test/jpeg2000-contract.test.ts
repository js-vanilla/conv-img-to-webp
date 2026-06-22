import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('jpeg2000', () => ({
  JpxImage: class {
    width = 2;
    height = 1;
    componentsCount?: number;
    tiles?: unknown[];

    parse(data: Uint8Array): void {
      this.width = 2;
      this.height = 1;

      if (data[0] === 0x01) {
        this.tiles = [
          {
            left: 0,
            top: 0,
            width: 2,
            height: 1,
            items: new Uint8Array([10, 64, 20, 128])
          }
        ];
        return;
      }

      if (data[0] === 0x02) {
        this.componentsCount = 3;
        this.tiles = [
          {
            left: 0,
            top: 0,
            width: 2,
            height: 1,
            items: new Uint8Array([10, 20, 30])
          }
        ];
        return;
      }

      if (data[0] === 0x03) {
        this.width = 100;
        this.height = 100;
        this.componentsCount = 3;
        this.tiles = [
          {
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            items: new Uint8Array(100 * 100 * 3)
          }
        ];
        return;
      }

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

let decodeJpeg2000: typeof import('../src/decoders/jpeg2000.js').decodeJpeg2000;

beforeAll(async () => {
  ({ decodeJpeg2000 } = await import('../src/decoders/jpeg2000.js'));
});

describe('JPEG 2000 component contract', () => {
  it('maps two-component grayscale+alpha images to RGBA correctly', async () => {
    await expect(decodeJpeg2000(new Uint8Array([0xff, 0x4f, 0xff, 0x51]))).resolves.toMatchObject({
      width: 2,
      height: 1,
      components: 2,
      data: new Uint8Array([10, 10, 10, 64, 20, 20, 20, 128])
    });
  });

  it('derives component count when decoder metadata is absent', async () => {
    await expect(decodeJpeg2000(new Uint8Array([0x01]))).resolves.toMatchObject({
      components: 2,
      data: new Uint8Array([10, 10, 10, 64, 20, 20, 20, 128])
    });
  });

  it('rejects tile sample length mismatches instead of reading undefined pixels', async () => {
    await expect(decodeJpeg2000(new Uint8Array([0x02]))).rejects.toMatchObject({ code: 'DECODE_ERROR' });
  });

  it('applies configured pixel limits before RGBA allocation', async () => {
    await expect(decodeJpeg2000(new Uint8Array([0x03]), { maxPixels: 10 })).rejects.toMatchObject({ code: 'DECODE_ERROR' });
  });
});
