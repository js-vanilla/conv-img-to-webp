export type SupportedImageType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/tiff'
  | 'image/jp2'
  | 'image/j2k';

export type ImageInput = Blob | File | ArrayBuffer | Uint8Array | DataView | ArrayBufferView | string;

export type WebPOutputKind = 'blob' | 'arrayBuffer' | 'dataURL';

export interface ConvertToWebPOptions<TOutput extends WebPOutputKind = 'blob'> {
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
  /** Maximum input size in bytes before decode. Defaults to 100 MiB. */
  maxInputBytes?: number;
  /** Maximum decoded pixel count before allocating RGBA/canvas buffers. Defaults to 50,000,000. */
  maxPixels?: number;
  /** Maximum decoded image width. Defaults to 20,000. */
  maxWidth?: number;
  /** Maximum decoded image height. Defaults to 20,000. */
  maxHeight?: number;
  /** Browser image orientation option used for native JPEG/PNG/GIF decoding. */
  imageOrientation?: ImageOrientation;
  /** Browser color-space conversion option used for native JPEG/PNG/GIF decoding. */
  colorSpaceConversion?: ColorSpaceConversion;
  /** Custom canvas factory for tests or non-standard browser runtimes. */
  canvasFactory?: (width: number, height: number) => HTMLCanvasElement | OffscreenCanvas;
}

type OutputFor<TOutput extends WebPOutputKind | undefined> =
  TOutput extends 'arrayBuffer' ? ArrayBuffer : TOutput extends 'dataURL' ? string : Blob;

export interface ConversionResult<TOutput extends WebPOutputKind | undefined = 'blob'> {
  output: OutputFor<TOutput>;
  inputType: SupportedImageType;
  metadata: Record<string, unknown>;
}

export declare function convertToWebP<TOutput extends WebPOutputKind | undefined = 'blob'>(
  input: ImageInput,
  options?: ConvertToWebPOptions<NonNullable<TOutput>>
): Promise<OutputFor<TOutput>>;

export declare function convertToWebPWithMetadata<TOutput extends WebPOutputKind | undefined = 'blob'>(
  input: ImageInput,
  options?: ConvertToWebPOptions<NonNullable<TOutput>>
): Promise<ConversionResult<TOutput>>;

export declare function detectImageType(bytesOrBuffer: Uint8Array | ArrayBuffer, mimeHint?: string): SupportedImageType | undefined;
export declare function normalizeMimeType(mime?: string): string | undefined;
export declare function isTiff(type?: string): boolean;
export declare function isJpeg2000(type?: string): boolean;
export declare function getTiffPageCount(input: ImageInput, options?: Pick<ConvertToWebPOptions, 'signal' | 'maxInputBytes'>): Promise<number>;

export interface RasterImage {
  data: Uint8Array;
  width: number;
  height: number;
  format: string;
  [key: string]: unknown;
}

export declare function decodeTiff(input: ImageInput, options?: ConvertToWebPOptions): Promise<RasterImage & { page: number; pageCount: number }>;
export declare function decodeJpeg2000(input: ImageInput, options?: ConvertToWebPOptions): Promise<RasterImage & { components: number }>;
export declare function encodeCanvasToWebP<TOutput extends WebPOutputKind | undefined = 'blob'>(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options?: ConvertToWebPOptions<NonNullable<TOutput>>
): Promise<OutputFor<TOutput>>;

export declare const ImageType: Readonly<{
  JPEG: 'image/jpeg';
  PNG: 'image/png';
  GIF: 'image/gif';
  TIFF: 'image/tiff';
  JP2: 'image/jp2';
  J2K: 'image/j2k';
}>;

export declare class ImageToWebPError extends Error { code: string; }
export declare class UnsupportedFormatError extends ImageToWebPError {}
export declare class DecodeError extends ImageToWebPError {}
export declare class EncodeError extends ImageToWebPError {}
export declare class MissingPageError extends ImageToWebPError {}
export declare class InvalidPageError extends ImageToWebPError {}
export declare class AbortConversionError extends ImageToWebPError {}
