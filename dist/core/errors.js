export class ImageToWebPError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.name = 'ImageToWebPError';
        this.code = code;
        if (cause !== undefined)
            this.cause = cause;
    }
}
export class UnsupportedFormatError extends ImageToWebPError {
    constructor(message, cause) {
        super(message, 'UNSUPPORTED_FORMAT', cause);
        this.name = 'UnsupportedFormatError';
    }
}
export class DecodeError extends ImageToWebPError {
    constructor(message, cause) {
        super(message, 'DECODE_ERROR', cause);
        this.name = 'DecodeError';
    }
}
export class EncodeError extends ImageToWebPError {
    constructor(message, cause) {
        super(message, 'ENCODE_ERROR', cause);
        this.name = 'EncodeError';
    }
}
export class MissingPageError extends ImageToWebPError {
    constructor(message) {
        super(message, 'TIFF_PAGE_REQUIRED');
        this.name = 'MissingPageError';
    }
}
export class InvalidPageError extends ImageToWebPError {
    constructor(message) {
        super(message, 'INVALID_TIFF_PAGE');
        this.name = 'InvalidPageError';
    }
}
export class AbortConversionError extends ImageToWebPError {
    constructor(message = 'Image conversion was aborted.') {
        super(message, 'ABORTED');
        this.name = 'AbortConversionError';
    }
}
//# sourceMappingURL=errors.js.map