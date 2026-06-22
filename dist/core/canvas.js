import { assertImageDimensions, assertRgbaBufferLength } from './assert.js';
import { EncodeError } from './errors.js';
export function createCanvas(width, height, factory, options = {}) {
    assertImageDimensions(width, height, options);
    if (factory) {
        const canvas = factory(width, height);
        if (!canvas)
            throw new EncodeError('The provided canvasFactory returned no canvas.');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(width, height);
    }
    if (typeof document !== 'undefined' && document.createElement) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    throw new EncodeError('No browser canvas implementation is available. This library requires OffscreenCanvas or HTMLCanvasElement.');
}
export function get2dContext(canvas, settings = { willReadFrequently: true }) {
    const ctx = canvas.getContext('2d', settings);
    if (!ctx)
        throw new EncodeError('Unable to create a 2D canvas context.');
    return ctx;
}
export function closeBitmap(bitmap) {
    if (bitmap && 'close' in bitmap && typeof bitmap.close === 'function')
        bitmap.close();
}
export function rasterToCanvas(raster, options = {}) {
    assertImageDimensions(raster.width, raster.height, options);
    assertRgbaBufferLength(raster.data, raster.width, raster.height);
    const canvas = createCanvas(raster.width, raster.height, options.canvasFactory, options);
    const ctx = get2dContext(canvas, { willReadFrequently: false });
    const rgba = raster.data instanceof Uint8ClampedArray
        ? raster.data
        : new Uint8ClampedArray(raster.data.buffer, raster.data.byteOffset, raster.data.byteLength);
    const imageData = new ImageData(rgba, raster.width, raster.height);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
//# sourceMappingURL=canvas.js.map