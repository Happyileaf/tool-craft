const entityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
  ' ': '&nbsp;',
  '\n': '<br>',
};

const reverseEntityMap: Record<string, string> = Object.entries(entityMap).reduce(
  (acc, [char, entity]) => {
    acc[entity] = char;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * HTML 实体编码
 */
export function htmlEntityEncode(input: string): string {
  let result = input;
  // 先处理已有的 & 避免重复编码
  result = result.replace(/&/g, (substring) => entityMap[substring] ?? substring);
  // 再处理其他字符
  for (const [char, entity] of Object.entries(entityMap)) {
    if (char === '&') continue; // 已经处理过了
    // 使用 RegExp 构造全局替换，需要escape特殊字符
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedChar, 'g'), entity);
  }
  return result;
}

/**
 * HTML 实体解码
 */
export function htmlEntityDecode(input: string): string {
  let result = input;
  // 匹配命名实体和数字实体
  const entityPattern = /&(#(?:x[0-9a-fA-F]+|[0-9]+)|[a-zA-Z][0-9a-zA-Z]+);/g;
  result = result.replace(entityPattern, (match: string, entityName?: string) => {
    // 检查是否是预定义的命名实体
    if (reverseEntityMap[match]) {
      return reverseEntityMap[match];
    }
    // 检查数字实体
    if (entityName && entityName.startsWith('#')) {
      let code: number;
      if (entityName.startsWith('#x')) {
        // 十六进制
        code = parseInt(entityName.slice(2), 16);
      } else {
        // 十进制
        code = parseInt(entityName.slice(1), 10);
      }
      if (!isNaN(code)) {
        return String.fromCodePoint(code);
      }
    }
    // 无法识别，保持原样
    return match;
  });
  return result;
}
