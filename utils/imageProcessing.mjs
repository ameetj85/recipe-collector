// Resize and re-encode recipe photos before they are stored as BLOBs.
// Plain ESM with no `@/` imports so scripts/migrate-mongo-to-sqlite.mjs can
// use it too.
//
// Why these limits: the largest place a recipe photo is shown is the
// full-bleed header on /recipes/[id] (100vw wide, 320-440px tall,
// object-cover). Its *width* is what has to hold up, so the cap is set by
// width: 2400px covers a 1920px desktop with headroom and most of a 2x
// (retina) laptop screen, without storing 12-megapixel phone originals.
// Height gets a looser cap so portrait photos (common for food) keep enough
// width to fill the header without being upscaled. next/image then serves
// smaller variants of this source to smaller screens, so phones never
// download the full size.
//
// Images that are already within the limits are kept byte-for-byte when that
// is smaller than re-encoding them (re-encoding an already-compressed JPEG
// costs quality and often bytes), as long as they are a web format and carry
// no EXIF data (orientation must be applied, and GPS/camera data stripped).
import sharp from 'sharp';

export const MAX_IMAGE_WIDTH = 2400;
export const MAX_IMAGE_HEIGHT = 3200;
export const WEBP_QUALITY = 82;

const PASSTHROUGH_FORMATS = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function processImage(input) {
  const source = sharp(input, { failOn: 'error' });
  const meta = await source.metadata();

  const { data, info } = await source
    .rotate() // apply EXIF orientation, then strip metadata
    .resize({
      width: MAX_IMAGE_WIDTH,
      height: MAX_IMAGE_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  const canKeepOriginal =
    PASSTHROUGH_FORMATS[meta.format] &&
    !meta.exif &&
    (!meta.orientation || meta.orientation === 1) &&
    (meta.pages ?? 1) === 1 &&
    meta.width <= MAX_IMAGE_WIDTH &&
    meta.height <= MAX_IMAGE_HEIGHT &&
    input.length <= data.length;

  if (canKeepOriginal) {
    const original = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return {
      data: original,
      mimeType: PASSTHROUGH_FORMATS[meta.format],
      width: meta.width,
      height: meta.height,
      byteSize: original.length,
    };
  }

  return {
    data,
    mimeType: 'image/webp',
    width: info.width,
    height: info.height,
    byteSize: data.length,
  };
}
