# @cyfung/image-to-webp

Pure JavaScript, ESM-first browser library for converting JPG/JPEG, JPEG 2000/JP2/J2K, GIF, PNG, and TIFF images to WebP.

The common path for JPEG, PNG, and GIF uses the browser's native image decoder plus canvas WebP encoding for high throughput. TIFF and JPEG 2000 support are isolated behind dynamic imports, so applications that only convert common web formats do not pay the cost of loading those codecs.

## Requirements

- Browser/runtime: ES2015+ syntax, `Blob`, `createImageBitmap` or `HTMLImageElement`, and canvas WebP encoding.
- Package manager: pnpm.
- Build tool: Rspack 2.0.
- TIFF decoding dependency: `utif2`.
- JPEG 2000 decoding dependency: `jpeg2000`.

## Install

```bash
pnpm add @cyfung/image-to-webp
```

For local development from this repository:

```bash
pnpm install
pnpm build
pnpm test
```

## Usage

```js
import { convertToWebP } from '@cyfung/image-to-webp';

const webpBlob = await convertToWebP(file, {
  quality: 0.9
});
```

### Output an ArrayBuffer or data URL

```js
const bytes = await convertToWebP(file, {
  output: 'arrayBuffer',
  quality: 0.85
});

const dataUrl = await convertToWebP(file, {
  output: 'dataURL'
});
```

### Multi-page TIFF contract

Multi-page TIFFs are intentionally strict. A caller must pass a zero-based page number. If the TIFF has more than one page and no page is provided, the library throws `MissingPageError` with code `TIFF_PAGE_REQUIRED`.

```js
import { convertToWebP, getTiffPageCount } from '@cyfung/image-to-webp';

const pageCount = await getTiffPageCount(tiffFile);
const webp = await convertToWebP(tiffFile, {
  page: 2, // third TIFF page
  quality: 0.92
});
```

Single-page TIFF files default to page `0`.

## API

### `convertToWebP(input, options?)`

Converts a supported image input to WebP.

`input` may be a `Blob`, `File`, `ArrayBuffer`, typed array, `DataView`, or data URL string.

Options:

- `quality`: WebP quality from `0` to `1`, default `0.92`.
- `output`: `'blob'`, `'arrayBuffer'`, or `'dataURL'`; default `'blob'`.
- `type`: optional input type override.
- `mimeType`: optional MIME hint for raw byte inputs.
- `page`: zero-based TIFF page number. Required for multi-page TIFF files.
- `signal`: optional `AbortSignal`.
- `canvasFactory`: optional custom canvas factory for tests or custom browser runtimes.

### `convertToWebPWithMetadata(input, options?)`

Returns `{ output, inputType, metadata }`. TIFF metadata includes `{ page, pageCount }`.

### `detectImageType(bytes, mimeHint?)`

Detects supported input types using magic bytes, falling back to a MIME hint when magic bytes are insufficient.

### `getTiffPageCount(input)`

Returns the number of TIFF pages/images without converting to WebP.

## Format notes

- JPEG/JPG: browser native decode, canvas WebP encode.
- PNG: browser native decode, canvas WebP encode.
- GIF: browser native decode of the first rendered frame, canvas WebP encode. Animated WebP output is intentionally out of scope for this lightweight library.
- TIFF: pure JavaScript decode via `utif2`, explicit page selection for multi-page files.
- JPEG 2000/JP2/J2K: pure JavaScript decode via `jpeg2000`, then canvas WebP encode.

## Tree-shaking and bundle shape

The package sets `sideEffects: false`, uses ESM exports, and builds with Rspack 2.0 `modern-module` output. TIFF and JPEG 2000 codecs are imported only when those formats are converted.

```js
import { detectImageType } from '@cyfung/image-to-webp/detect';
```

## Rspack 2.0

`rspack.config.mjs` targets ES2015 browsers, emits ESM library output, preserves dynamic imports, and marks codec packages as ESM externals so downstream bundlers can split them effectively.

## Error handling

All custom errors extend `ImageToWebPError` and include a stable `code`:

- `UNSUPPORTED_FORMAT`
- `DECODE_ERROR`
- `ENCODE_ERROR`
- `TIFF_PAGE_REQUIRED`
- `INVALID_TIFF_PAGE`
- `ABORTED`

```js
try {
  await convertToWebP(file);
} catch (error) {
  if (error.code === 'TIFF_PAGE_REQUIRED') {
    // Show a page picker to the caller.
  }
}
```
