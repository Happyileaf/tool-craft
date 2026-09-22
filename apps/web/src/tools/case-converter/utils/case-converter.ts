/**
 * Case converter utils
 * Supports: camelCase ↔ snake_case ↔ kebab-case + uppercase ↔ lowercase
 */

/**
 * Split string into words regardless of current case format
 */
function splitIntoWords(str: string): string[] {
  // Handle empty string
  if (!str) return [];

  // Add space before capital letters that are either:
  // 1. After a lowercase letter
  // 2. After another capital letter but followed by a lowercase
  let result = str.replace(/([a-z\d])([A-Z])/g, '$1 $2');
  result = result.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  // Split on separators
  return result.split(/[-_\s]+/).filter(Boolean);
}

/**
 * Convert to camelCase
 */
export function toCamelCase(str: string): string {
  const words = splitIntoWords(str);
  if (words.length === 0) return '';
  return words[0]!.toLowerCase() + words.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}

/**
 * Convert to snake_case
 */
export function toSnakeCase(str: string): string {
  const words = splitIntoWords(str);
  return words.map(word => word.toLowerCase()).join('_');
}

/**
 * Convert to kebab-case
 */
export function toKebabCase(str: string): string {
  const words = splitIntoWords(str);
  return words.map(word => word.toLowerCase()).join('-');
}

/**
 * Convert to PascalCase
 */
export function toPascalCase(str: string): string {
  const words = splitIntoWords(str);
  if (words.length === 0) return '';
  return words.map(word => word!.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}

/**
 * Convert to UPPER_CASE
 */
export function toUpperCase(str: string): string {
  return str.toUpperCase();
}

/**
 * Convert to lower_case
 */
export function toLowerCase(str: string): string {
  return str.toLowerCase();
}

/**
 * Convert string to target format
 */
export type CaseFormat = 'camel' | 'snake' | 'kebab' | 'pascal' | 'upper' | 'lower';

export function convertCase(input: string, format: CaseFormat): string {
  switch (format) {
    case 'camel':
      return toCamelCase(input);
    case 'snake':
      return toSnakeCase(input);
    case 'kebab':
      return toKebabCase(input);
    case 'pascal':
      return toPascalCase(input);
    case 'upper':
      return toUpperCase(input);
    case 'lower':
      return toLowerCase(input);
    default:
      return input;
  }
}
