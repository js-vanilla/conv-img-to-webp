import type { Canvas2DContext, CanvasLike, ConvertToWebPOptions, WebPOutputKind, RasterImage } from '../types.js';
export declare function createCanvas(width: number, height: number, factory?: ConvertToWebPOptions<WebPOutputKind>['canvasFactory'], options?: ConvertToWebPOptions<WebPOutputKind>): CanvasLike;
export declare function get2dContext(canvas: CanvasLike, settings?: CanvasRenderingContext2DSettings): Canvas2DContext;
export declare function closeBitmap(bitmap: ImageBitmap | HTMLImageElement | undefined): void;
export declare function rasterToCanvas(raster: RasterImage, options?: ConvertToWebPOptions<WebPOutputKind>): CanvasLike;
//# sourceMappingURL=canvas.d.ts.map