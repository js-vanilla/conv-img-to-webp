import type { SupportedImageType, WebPFeature, WebPFeatureCallback } from '../types.js';
export declare function normalizeMimeType(mime?: string | null): string | undefined;
export declare function detectImageType(bytesOrBuffer: Uint8Array | ArrayBuffer | ArrayBufferView | null | undefined, mimeHint?: string): SupportedImageType | undefined;
export declare function isTiff(type?: string): boolean;
export declare function isJpeg2000(type?: string): boolean;
export declare function checkWebPFeature(feature: WebPFeature): Promise<boolean>;
export declare function checkWebPFeature(feature: WebPFeature, callback: WebPFeatureCallback): void;
export declare const check_webp_feature: typeof checkWebPFeature;
export declare const ImageType: Readonly<{
    readonly JPEG: "image/jpeg";
    readonly PNG: "image/png";
    readonly GIF: "image/gif";
    readonly TIFF: "image/tiff";
    readonly JP2: "image/jp2";
    readonly J2K: "image/j2k";
}>;
export type { SupportedImageType, WebPFeature, WebPFeatureCallback };
//# sourceMappingURL=detect.d.ts.map