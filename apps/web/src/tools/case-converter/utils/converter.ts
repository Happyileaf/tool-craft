import { CaseConversionMode } from '../constants';

export function convertCase(text: string, mode: CaseConversionMode): string {
  switch (mode) {
    case CaseConversionMode.LOWERCASE:
      return text.toLowerCase();
    case CaseConversionMode.UPPERCASE:
      return text.toUpperCase();
    case CaseConversionMode.CAPITALIZE_FIRST: {
      if (!text) return text;
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    case CaseConversionMode.SENTENCE: {
      // Split by sentence endings (. ! ?) followed by whitespace or newline
      // This handles basic sentence capitalization
      return text
        .toLowerCase()
        .replace(
          /(^|[.!?]\s+)([a-z])/g,
          (match, p1, p2) => p1 + p2.toUpperCase()
        );
    }
    default:
      return text;
  }
}
