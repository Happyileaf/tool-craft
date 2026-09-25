/**
 * Case converter utilities
 * Supported cases:
 * - camelCase: helloWorld
 * - PascalCase: HelloWorld
 * - snake_case: hello_world
 * - kebab-case: hello-world
 * - CONSTANT_CASE: HELLO_WORLD
 * - Title Case: Hello World
 * - Sentence case: Hello world
 */

// Split input into words, handles various separators
function splitIntoWords(input: string): string[] {
  // Handle existing separators
  let words = input
    .replace(/[-_\s.]+/g, ' ')
    .trim()
    .split(' ');

  // Handle camelCase/PascalCase by adding spaces before uppercase letters
  words = words
    .flatMap(word => {
      return word.split(/(?=[A-Z])/);
    })
    .filter(word => word.length > 0);

  // Lowercase all words for uniform processing
  return words.map(word => word.toLowerCase());
}

export function toCamelCase(input: string): string {
  const words = splitIntoWords(input);
  if (words.length === 0) return '';
  return words[0] + words.slice(1).map(capitalizeFirst).join('');
}

export function toPascalCase(input: string): string {
  const words = splitIntoWords(input);
  return words.map(capitalizeFirst).join('');
}

export function toSnakeCase(input: string): string {
  const words = splitIntoWords(input);
  return words.join('_');
}

export function toKebabCase(input: string): string {
  const words = splitIntoWords(input);
  return words.join('-');
}

export function toConstantCase(input: string): string {
  const words = splitIntoWords(input);
  return words.map(word => word.toUpperCase()).join('_');
}

export function toTitleCase(input: string): string {
  const words = splitIntoWords(input);
  return words.map(capitalizeFirst).join(' ');
}

export function toSentenceCase(input: string): string {
  const words = splitIntoWords(input);
  if (words.length === 0) return '';
  return capitalizeFirst(words[0]) + ' ' + words.slice(1).join(' ');
}

function capitalizeFirst(word: string): string {
  if (!word) return '';
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

export type CaseType = 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant' | 'title' | 'sentence';

export function convertCase(input: string, targetCase: CaseType): string {
  switch (targetCase) {
    case 'camel':
      return toCamelCase(input);
    case 'pascal':
      return toPascalCase(input);
    case 'snake':
      return toSnakeCase(input);
    case 'kebab':
      return toKebabCase(input);
    case 'constant':
      return toConstantCase(input);
    case 'title':
      return toTitleCase(input);
    case 'sentence':
      return toSentenceCase(input);
    default:
      return input;
  }
}
