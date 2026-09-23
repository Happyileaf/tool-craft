export function removeDuplicateLines(
  text: string,
  caseSensitive: boolean,
  sortLines: boolean
): string {
  if (!text) return '';

  const lines = text.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const key = caseSensitive ? line : line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
    }
  }

  if (sortLines) {
    if (caseSensitive) {
      result.sort();
    } else {
      result.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }
  }

  return result.join('\n');
}
