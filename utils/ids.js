import crypto from 'node:crypto';

// 24 lowercase hex characters: the same format as the Mongo ObjectIds that
// migrated rows keep, so old /recipes/<id> links still work.
export const newId = () => crypto.randomBytes(12).toString('hex');

export const isValidId = (id) =>
  typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id);

// Ids are stored lowercase; normalise anything that came from a URL or client.
export const normalizeId = (id) => (isValidId(id) ? id.toLowerCase() : null);
