// Casting helpers for form values (Mongoose used to do this for us).

export class FormValueError extends Error {}

// Checkbox/flag values -> 0/1.
export const toBool = (value) =>
  value === true || ['true', 'on', '1', 'yes'].includes(String(value ?? '').toLowerCase())
    ? 1
    : 0;

// Numeric fields: empty -> 0; anything non-numeric is a user error.
export const toNum = (value, field) => {
  if (value === null || value === undefined || String(value).trim() === '') return 0;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new FormValueError(`${field} must be a number.`);
  }
  return num;
};

// Optional text: '' / null -> null.
export const toText = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text === '' ? null : text;
};
