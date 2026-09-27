/**
 * 将 CSV 字符串转换为 JSON 数组
 * @param csv CSV 字符串
 * @param delimiter 分隔符
 * @returns 解析后的 JSON 数组
 */
export function csvToJson(csv: string, delimiter: string = ','): Record<string, string>[] {
  const lines = csv.trim().split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = parseLine(lines[0], delimiter).map(header => header.trim());
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    result.push(row);
  }

  return result;
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
