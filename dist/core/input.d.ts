import type { ImageInput } from '../types.js';
export declare function getMimeHint(input: unknown): string | undefined;
export declare function toArrayBuffer(input: ImageInput): Promise<ArrayBuffer>;
export declare function toBlob(input: ImageInput, fallbackMime?: string): Promise<Blob>;
//# sourceMappingURL=input.d.ts.map