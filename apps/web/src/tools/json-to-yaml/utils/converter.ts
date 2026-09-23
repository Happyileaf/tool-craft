/**
 * Convert JSON to YAML format
 * Pure implementation without dependencies
 */

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function escapeYamlString(str: string): string {
  if (str.includes('\n') || str.includes(':') || str.includes('#') || str.includes('"') || str.includes("'") || /^\d+$/.test(str)) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

function formatValue(value: JsonValue, indent: number): string {
  const spaces = '  '.repeat(indent);
  if (typeof value === 'string') {
    return escapeYamlString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    return '\n' + value.map(item => `${spaces}- ${formatValue(item, indent + 1)}`).join('\n');
  }
  // object
  if (Object.keys(value).length === 0) {
    return '{}';
  }
  return '\n' + Object.entries(value).map(([key, val]) => `${spaces}${key}: ${formatValue(val, indent + 1)}`).join('\n');
}

export function jsonToYaml(jsonStr: string): { success: boolean; result: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr.trim()) as JsonValue;
    const yaml = formatValue(parsed, 0);
    return {
      success: true,
      result: yaml.trimStart()
    };
  } catch (error) {
    return {
      success: false,
      result: '',
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}
