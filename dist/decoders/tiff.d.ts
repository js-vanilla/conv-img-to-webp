import type { ConvertToWebPOptions, WebPOutputKind, ImageInput, RasterImage } from '../types.js';
export declare function getTiffPageCount(input: ImageInput, options?: ConvertToWebPOptions<WebPOutputKind>): Promise<number>;
export declare function decodeTiff(input: ImageInput, options?: ConvertToWebPOptions<WebPOutputKind>): Promise<RasterImage & {
    page: number;
    pageCount: number;
}>;
//# sourceMappingURL=tiff.d.ts.map