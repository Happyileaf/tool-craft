/**
 * JSON to YAML conversion utility
 */

/**
 * Convert JSON object to YAML string
 * Pure function implementation
 */
export function jsonToYaml(obj: any, indent: number = 2): string {
  const lines: string[] = [];
  const indentStr = ' '.repeat(indent);

  const processValue = (value: any, currentIndent: number): string => {
    const indentPadding = ' '.repeat(currentIndent);
    if (value === null) return 'null';
    if (value === undefined) return '';
    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') {
      // Need to quote strings with special characters
      if (value.includes(':') || value.includes('#') || value.includes('\n') || value === '') {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const arrayLines = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return `${indentPadding}-${processValue(item, currentIndent + indent).trimStart()}`;
        }
        return `${indentPadding}- ${processValue(item, currentIndent + indent)}`;
      });
      return '\n' + arrayLines.join('\n');
    }
    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return '{}';
      const objLines = Object.entries(value).map(([key, val]) => {
        return `${indentPadding}${key}:${processValue(val, currentIndent + indent)}`;
      });
      return '\n' + objLines.join('\n');
    }
    return '';
  };

  lines.push(processValue(obj, 0));
  return lines.join('\n').trim();
}
