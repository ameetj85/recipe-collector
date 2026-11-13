// A recipe image value is either a URL/path served by the app
// ("/api/images/<id>" for stored images, or an absolute http(s) URL) or the
// bare file name of a seed image in public/images/recipes/.
// A recipe without images falls back to the logo (next/image rejects an
// empty src).
export const FALLBACK_IMAGE = '/images/logo.png';

export const imageSrc = (value) => {
  if (!value) return FALLBACK_IMAGE;
  if (value.startsWith('http') || value.startsWith('/')) return value;
  return `/images/recipes/${value}`;
};
