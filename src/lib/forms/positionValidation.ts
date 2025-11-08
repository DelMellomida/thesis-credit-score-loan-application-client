/**
 * Valid job positions from backend JobEnum
 */
export const validPositions = {
  TEACHER: "Teacher",
  SECURITY_GUARD: "Security Guard", 
  SEAMAN: "Seaman",
  OTHERS: "Others"
} as const;

export type Position = typeof validPositions[keyof typeof validPositions];

/**
 * Validates a job position and returns either the validated position or 'Others'
 */
export function validatePosition(position: string): Position {
  // Convert to title case for matching
  const standardized = position
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Check if it matches any valid position
  const matchingPosition = Object.values(validPositions).find(
    valid => valid.toLowerCase() === standardized.toLowerCase()
  );

  return matchingPosition || validPositions.OTHERS;
}