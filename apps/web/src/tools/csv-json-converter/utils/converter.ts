/**
 * Convert CSV text to JSON array
 */
export function convertCsvToJson(csvText: string): any[] {
  // Trim whitespace and split into lines
  const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Get headers from first line
  const headers = parseLine(lines[0]!);
  const result: any[] = [];

  // Parse data lines
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]!);
    const obj: Record<string, any> = {};
    headers.forEach((header: string | undefined, index: number) => {
      let value: any = values[index] || '';
      if (typeof value !== 'string') {
        value = '';
      }
      value = value.trim();
      // Try to convert to number if possible
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      } else if (value.toLowerCase() === 'true') {
        value = true;
      } else if (value.toLowerCase() === 'false') {
        value = false;
      }
      if (header) {
        obj[header.trim()] = value;
      }
    });
    result.push(obj);
  }

  return result;
}

/**
 * Convert JSON array to CSV text
 */
export function convertJsonToCsv(jsonArray: any[]): string {
  if (!Array.isArray(jsonArray) || jsonArray.length === 0) return '';

  // Get all unique headers from all objects
  const headers = Array.from(
    new Set(
      jsonArray.flatMap((obj: any) => Object.keys(obj))
    )
  );

  // Create CSV lines
  const lines = [
    headers.join(',')
  ];

  jsonArray.forEach((obj: any) => {
    const values = headers.map((header: string) => {
      let value: any = obj[header] ?? '';
      // Quote values containing commas or quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      return String(value);
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

/**
 * Parse a single CSV line respecting quotes
 */
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuote && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}