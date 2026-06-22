import type { ConversionResult, ConvertToWebPOptions, ImageInput, OutputFor, WebPOutputKind } from '../types.js';
export declare function convertToWebP<TOutput extends WebPOutputKind | undefined = 'blob'>(input: ImageInput, options?: ConvertToWebPOptions<NonNullable<TOutput>>): Promise<OutputFor<TOutput>>;
export declare function convertToWebPWithMetadata<TOutput extends WebPOutputKind | undefined = 'blob'>(input: ImageInput, options?: ConvertToWebPOptions<NonNullable<TOutput>>): Promise<ConversionResult<TOutput>>;
//# sourceMappingURL=convert.d.ts.map