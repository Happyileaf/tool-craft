// YAML parser based on a simple implementation
// This handles most common YAML features

interface YamlNode {
  [key: string]: any;
}

function trimIndent(str: string): string {
  const lines = str.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  if (nonEmptyLines.length === 0) return str;
  
  // Find the minimum indentation level
  const minIndent = Math.min(...nonEmptyLines.map(line => {
    const match = line.match(/^\s+/);
    return match ? match[0].length : 0;
  }));
  
  if (minIndent === 0) return str;
  
  return lines.map(line => {
    if (line.length >= minIndent) {
      return line.slice(minIndent);
    }
    return line;
  }).join('\n');
}

function parseValue(valueStr: string): any {
  valueStr = valueStr.trim();
  
  // Boolean
  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;
  
  // Null
  if (valueStr === 'null' || valueStr === '~') return null;
  
  // Number
  if (/^-?\d+$/.test(valueStr)) {
    return parseInt(valueStr, 10);
  }
  if (/^-?\d+\.\d+$/.test(valueStr)) {
    return parseFloat(valueStr);
  }
  
  // String (remove quotes if present)
  if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || 
      (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
    return valueStr.slice(1, -1);
  }
  
  return valueStr;
}

function parseYaml(yaml: string): any {
  const lines = yaml.split('\n').map(line => {
    // Remove comments
    const commentIndex = line.indexOf('#');
    if (commentIndex !== -1) {
      line = line.slice(0, commentIndex);
    }
    return line.trimEnd();
  });
  
  const root: YamlNode = {};
  const stack: Array<{ obj: YamlNode; indent: number }> = [{ obj: root, indent: -1 }];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.trim().length === 0) continue;
    
    // Calculate indentation
    const indent = line.search(/\S/);
    const trimmedLine = line.trim();
    
    // List item
    if (trimmedLine.startsWith('- ')) {
      // TODO: handle list items properly
      continue;
    }
    
    // Key-value pair
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmedLine.slice(0, colonIndex).trim();
    let valueStr = trimmedLine.slice(colonIndex + 1).trim();
    
    if (valueStr.length === 0) {
      // Multi-line or nested
      const nextLines: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        if (nextLine.trim().length === 0) {
          j++;
          continue;
        }
        const nextIndent = nextLine.search(/\S/);
        if (nextIndent > indent) {
          nextLines.push(nextLine.trimStart());
          j++;
        } else {
          break;
        }
      }
      
      if (nextLines.length > 0) {
        const nestedYaml = trimIndent(nextLines.join('\n'));
        const nestedObj = parseYaml(nestedYaml);
        const currentObj = stack.find(s => s.indent < indent).obj;
        currentObj[key] = nestedObj;
        stack.push({ obj: nestedObj, indent });
        i = j - 1;
        continue;
      }
    }
    
    // Simple key-value
    const currentObj = stack[stack.length - 1].obj;
    currentObj[key] = parseValue(valueStr);
  }
  
  return root;
}

export function yamlToJson(yaml: string): string {
  const parsed = parseYaml(yaml);
  return JSON.stringify(parsed, null, 2);
}
