export declare class ImageToWebPError extends Error {
    readonly code: string;
    cause?: unknown;
    constructor(message: string, code: string, cause?: unknown);
}
export declare class UnsupportedFormatError extends ImageToWebPError {
    constructor(message: string, cause?: unknown);
}
export declare class DecodeError extends ImageToWebPError {
    constructor(message: string, cause?: unknown);
}
export declare class EncodeError extends ImageToWebPError {
    constructor(message: string, cause?: unknown);
}
export declare class MissingPageError extends ImageToWebPError {
    constructor(message: string);
}
export declare class InvalidPageError extends ImageToWebPError {
    constructor(message: string);
}
export declare class AbortConversionError extends ImageToWebPError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map