import type { CanvasLike, ConvertToWebPOptions, OutputFor, WebPOutputKind } from '../types.js';
export declare function encodeCanvasToWebP<TOutput extends WebPOutputKind | undefined = 'blob'>(canvas: CanvasLike, options?: ConvertToWebPOptions<NonNullable<TOutput>>): Promise<OutputFor<TOutput>>;
//# sourceMappingURL=webp.d.ts.map