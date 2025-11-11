// Normalize a free-text position string without restricting allowed values.
// Returns a cleaned, title-cased string (e.g., "senior developer" -> "Senior Developer").
export function validatePosition(position: string): string {
  if (!position || typeof position !== 'string') return '';

  const standardized = position
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return standardized;
}