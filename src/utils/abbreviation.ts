// ============================================
// ABBREVIATION UTILS
// ============================================

export function toAbbreviation(input: string, maxLength = 3, fallback = '?'): string {
  const cleaned = (input || '').trim();
  if (!cleaned) return fallback;

  const abb = cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, maxLength);

  return abb || fallback;
}
