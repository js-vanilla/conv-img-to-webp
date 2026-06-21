import { AbortConversionError } from './errors.js';

export function throwIfAborted(signal) {
  if (signal && signal.aborted) {
    throw new AbortConversionError();
  }
}

export function clampQuality(quality) {
  if (quality === undefined || quality === null) return 0.92;
  const value = Number(quality);
  if (!Number.isFinite(value)) return 0.92;
  return Math.min(1, Math.max(0, value));
}

export function assertPositiveDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new RangeError(`Invalid image dimensions: ${width}x${height}.`);
  }
}
