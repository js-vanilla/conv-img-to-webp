import type { ResourceLimitsOptions } from '../types.js';
export declare const DEFAULT_LIMITS: Readonly<{
    readonly maxInputBytes: number;
    readonly maxPixels: 50000000;
    readonly maxWidth: 20000;
    readonly maxHeight: 20000;
}>;
export declare function throwIfAborted(signal?: AbortSignal): void;
export declare function clampQuality(quality?: number | null): number;
export declare function assertInputSize(byteLength: number, options?: ResourceLimitsOptions): void;
export declare function assertPositiveDimensions(width: number, height: number): void;
export declare function assertImageDimensions(width: number, height: number, options?: ResourceLimitsOptions): void;
export declare function assertRgbaBufferLength(data: Uint8Array | Uint8ClampedArray | undefined | null, width: number, height: number): void;
//# sourceMappingURL=assert.d.ts.map