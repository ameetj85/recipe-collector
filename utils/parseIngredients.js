// Convert the ingredients textarea value (one ingredient per line) into an
// array. Handles both \r\n and \n line endings and drops blank lines.
export const parseIngredients = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
