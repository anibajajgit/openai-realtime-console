
/**
 * Combines class names with proper handling of conditionals
 * @param  {...string} classes - class names to combine
 * @returns {string} - combined class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
