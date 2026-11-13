// Stored image BLOBs (served by app/api/images/[id]/route.js).
import { getDb } from '../config/database.js';

// { data, mime_type, byte_size } for a stored image, or null (missing id or a
// seed-file row, which is served from public/ instead).
export function getImageBlob(id) {
  return (
    getDb()
      .prepare(
        `SELECT data, mime_type, byte_size FROM recipe_images
         WHERE id = ? AND data IS NOT NULL`
      )
      .get(id) ?? null
  );
}
