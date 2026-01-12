/**
 * Utility functions for Hebrew text processing
 */

/**
 * Remove all Nikud (vowel marks and cantillation marks) from Hebrew text.
 * 
 * @param text - Hebrew text with Nikud
 * @returns Hebrew text without Nikud
 */
export function removeNikud(text: string): string {
  // Hebrew Nikud Unicode range: \u0591-\u05C7
  return text.replace(/[\u0591-\u05C7]/g, '');
}

/**
 * Normalize Hebrew text by removing Nikud and extra whitespace.
 * 
 * @param text - Hebrew text to normalize
 * @returns Normalized Hebrew text
 */
export function normalizeHebrew(text: string): string {
  const withoutNikud = removeNikud(text);
  return withoutNikud.replace(/\s+/g, ' ').trim();
}
