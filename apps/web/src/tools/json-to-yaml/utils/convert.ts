/**
 * Convert JSON value to YAML format
 */

function escapeYamlString(str: string): string {
  // If string contains special characters, quote it
  if (/[:#\[\],&*n]+|^-|^\d+$/.test(str) || str.startsWith(' ') || str.endsWith(' ')) {
    // Use double quotes if there are any escape sequences needed
    if (str.includes('"')) {
      return `'${str.replace(/'/g, "''")}'`;
    }
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

function convertToYaml(value: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  const nextIndent = indent + 1;

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return escapeYamlString(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    return value
      .map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          if (index === 0) {
            return `- ${convertToYaml(item, nextIndent).trimStart()}`;
          }
          return `\n${spaces}- ${convertToYaml(item, nextIndent).trimStart()}`;
        }
        return `-${convertToYaml(item, nextIndent)}`;
      })
      .join('\n');
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return '{}';
    }
    return keys
      .map((key) => {
        const childValue = value[key];
        if (typeof childValue === 'object' && childValue !== null) {
          return `${spaces}${key}:\n${convertToYaml(childValue, nextIndent)}`;
        }
        return `${spaces}${key}: ${convertToYaml(childValue, nextIndent)}`;
      })
      .join('\n');
  }

  return '';
}

export function jsonToYaml(json: string): string {
  try {
    const parsed = JSON.parse(json);
    return convertToYaml(parsed);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
}
