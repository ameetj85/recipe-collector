// Serves recipe images stored as BLOBs in SQLite. This is the only route
// handler besides NextAuth: binary responses can't come from a Server
// Component. Images are immutable (replacing one creates a new id), so they
// are cached forever.
import { getImageBlob } from '@/models/images';
import { normalizeId } from '@/utils/ids';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id: rawId } = await params;
  const id = normalizeId(rawId);
  const image = id ? getImageBlob(id) : null;

  if (!image) {
    return new Response('Not found', { status: 404 });
  }

  const etag = `"${id}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  return new Response(image.data, {
    headers: {
      'Content-Type': image.mime_type,
      'Content-Length': String(image.byte_size ?? image.data.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag,
    },
  });
}
