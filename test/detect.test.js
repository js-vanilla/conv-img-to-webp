import { describe, expect, it } from 'vitest';
import { detectImageType, ImageType, isJpeg2000, isTiff, normalizeMimeType } from '../src/core/detect.js';

function bytes(values) {
  return new Uint8Array(values);
}

describe('detectImageType', () => {
  it('detects JPEG', () => {
    expect(detectImageType(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe(ImageType.JPEG);
  });

  it('detects PNG', () => {
    expect(detectImageType(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(ImageType.PNG);
  });

  it('detects GIF', () => {
    expect(detectImageType(new TextEncoder().encode('GIF89a'))).toBe(ImageType.GIF);
  });

  it('detects classic TIFF and BigTIFF', () => {
    expect(detectImageType(bytes([0x49, 0x49, 0x2a, 0x00]))).toBe(ImageType.TIFF);
    expect(detectImageType(bytes([0x4d, 0x4d, 0x00, 0x2b]))).toBe(ImageType.TIFF);
  });

  it('detects JP2 signature boxes and raw codestreams', () => {
    expect(detectImageType(bytes([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a]))).toBe(ImageType.JP2);
    expect(detectImageType(bytes([0xff, 0x4f, 0xff, 0x51]))).toBe(ImageType.J2K);
  });

  it('normalizes common aliases', () => {
    expect(normalizeMimeType('image/jpg')).toBe(ImageType.JPEG);
    expect(normalizeMimeType('image/x-tiff')).toBe(ImageType.TIFF);
    expect(normalizeMimeType('image/jpeg2000')).toBe(ImageType.JP2);
  });

  it('reports format groups', () => {
    expect(isTiff('image/x-tiff')).toBe(true);
    expect(isJpeg2000('image/jp2')).toBe(true);
    expect(isJpeg2000('image/j2k')).toBe(true);
  });
});
