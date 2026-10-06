import Papa from 'papaparse';

export type ConvertDirection = 'csv-to-json' | 'json-to-csv';

export interface ConvertOptions {
  delimiter: string;
  newline: string;
}

export const csvToJson = (csv: string, options: ConvertOptions): string => {
  const result = Papa.parse(csv, {
    header: true,
    delimiter: options.delimiter === 'auto' ? '' : options.delimiter,
    skipEmptyLines: true
  });
  if (result.errors.length > 0) {
    const messages = result.errors.map(e => e.message).join(', ');
    throw new Error(`CSV parsing error: ${messages}`);
  }
  return JSON.stringify(result.data, null, 2);
};

export const jsonToCsv = (json: string, options: ConvertOptions): string => {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of objects');
    }
    const result = Papa.unparse(data, {
      delimiter: options.delimiter === 'auto' ? ',' : options.delimiter,
      newline: options.newline === 'auto' ? '\n' : options.newline
    });
    return result;
  } catch (error) {
    throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : String(error)}`);
  }
};
