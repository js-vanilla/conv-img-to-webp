export type SupportedImageType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/tiff' | 'image/jp2' | 'image/j2k';
export type ImageInput = Blob | File | ArrayBuffer | Uint8Array | DataView | ArrayBufferView | string;
export type WebPOutputKind = 'blob' | 'arrayBuffer' | 'dataURL';
export type OutputFor<TOutput extends WebPOutputKind | undefined> = TOutput extends 'arrayBuffer' ? ArrayBuffer : TOutput extends 'dataURL' ? string : Blob;
export type CanvasLike = HTMLCanvasElement | OffscreenCanvas;
export type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export interface ResourceLimitsOptions {
    /** Maximum input size in bytes before decode. Defaults to 100 MiB. */
    maxInputBytes?: number;
    /** Maximum decoded pixel count before allocating RGBA/canvas buffers. Defaults to 50,000,000. */
    maxPixels?: number;
    /** Maximum decoded image width. Defaults to 20,000. */
    maxWidth?: number;
    /** Maximum decoded image height. Defaults to 20,000. */
    maxHeight?: number;
}
export interface ConvertToWebPOptions<TOutput extends WebPOutputKind = 'blob'> extends ResourceLimitsOptions {
    /** WebP quality from 0 to 1. Defaults to 0.92. */
    quality?: number;
    /** Output container. Defaults to 'blob'. */
    output?: TOutput;
    /** Force an input type, otherwise the library detects magic bytes and MIME hints. */
    type?: SupportedImageType | 'image/jpg' | 'image/jpeg2000' | 'image/x-tiff' | string;
    /** Optional MIME hint when the input is raw bytes. */
    mimeType?: string;
    /** Zero-based TIFF page number. Required for multi-page TIFF files. */
    page?: number;
    /** AbortSignal checked between decode/encode stages. */
    signal?: AbortSignal;
    /** Browser image orientation option used for native JPEG/PNG/GIF decoding. */
    imageOrientation?: ImageOrientation;
    /** Browser color-space conversion option used for native JPEG/PNG/GIF decoding. */
    colorSpaceConversion?: ColorSpaceConversion;
    /** Custom canvas factory for tests or non-standard browser runtimes. */
    canvasFactory?: (width: number, height: number) => CanvasLike;
}
export interface ConversionResult<TOutput extends WebPOutputKind | undefined = 'blob'> {
    output: OutputFor<TOutput>;
    inputType: SupportedImageType;
    metadata: Record<string, unknown>;
}
export interface RasterImage {
    data: Uint8Array;
    width: number;
    height: number;
    format: SupportedImageType | string;
    [key: string]: unknown;
}
export type WebPFeature = 'lossy' | 'lossless' | 'alpha' | 'animation';
export type WebPFeatureCallback = (feature: WebPFeature, result: boolean) => void;
//# sourceMappingURL=types.d.ts.map