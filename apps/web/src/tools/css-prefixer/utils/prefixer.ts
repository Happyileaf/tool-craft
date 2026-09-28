// Vendor prefix mapping based on common properties
const PREFIX_MAP: Record<string, string[]> = {
  'appearance': ['-webkit-', '-moz-'],
  'backdrop-filter': ['-webkit-'],
  'background-clip': ['-webkit-'],
  'border-bottom-left-radius': ['-webkit-', '-moz-'],
  'border-bottom-right-radius': ['-webkit-', '-moz-'],
  'border-image': ['-webkit-', '-o-'],
  'border-radius': ['-webkit-', '-moz-'],
  'border-top-left-radius': ['-webkit-', '-moz-'],
  'border-top-right-radius': ['-webkit-', '-moz-'],
  'box-sizing': ['-webkit-', '-moz-'],
  'break-inside': ['-webkit-'],
  'column-count': ['-webkit-', '-moz-'],
  'column-gap': ['-webkit-', '-moz-'],
  'column-rule': ['-webkit-', '-moz-'],
  'column-span': ['-webkit-', '-moz-'],
  'column-width': ['-webkit-', '-moz-'],
  'display': ['-webkit-', '-ms-'],
  'flex': ['-webkit-', '-ms-'],
  'flexbox': ['-webkit-', '-ms-'],
  'flex-direction': ['-webkit-', '-ms-'],
  'flex-flow': ['-webkit-', '-ms-'],
  'flex-grow': ['-webkit-', '-ms-'],
  'flex-shrink': ['-webkit-', '-ms-'],
  'flex-wrap': ['-webkit-', '-ms-'],
  'gap': ['-webkit-'],
  'grid': ['-ms-'],
  'grid-area': ['-ms-'],
  'grid-column': ['-ms-'],
  'grid-row': ['-ms-'],
  'grid-template': ['-ms-'],
  'hyphens': ['-webkit-', '-moz-', '-ms-'],
  'image-rendering': ['-webkit-', '-moz-'],
  'inline-flex': ['-webkit-', '-moz-'],
  'justify-content': ['-webkit-', '-ms-'],
  'mask': ['-webkit-'],
  'object-fit': ['-webkit-', '-o-'],
  'object-position': ['-webkit-', '-o-'],
  'opacity': ['-moz-'],
  'outline': ['-webkit-'],
  'overflow-scrolling': ['-webkit-'],
  'perspective': ['-webkit-', '-moz-'],
  'position': ['-webkit-', '-moz-'],
  'region-fragment': ['-webkit-'],
  'resize': ['-webkit-'],
  'text-align-last': ['-moz-'],
  'text-decoration': ['-webkit-'],
  'text-overflow': ['-o-'],
  'text-size-adjust': ['-webkit-', '-moz-'],
  'transform': ['-webkit-', '-ms-', '-moz-'],
  'transition': ['-webkit-', '-o-', '-moz-'],
  'user-select': ['-webkit-', '-moz-', '-ms-'],
  'will-change': ['-webkit-'],
};

function addPrefixesToProperty(property: string): string[] {
  const prefixes = PREFIX_MAP[property];
  if (!prefixes) {
    return [property];
  }
  // Add prefixed versions plus the original property
  return [...prefixes.map(prefix => prefix + property), property];
}

function processDeclaration(property: string, value: string): string {
  const prefixedProperties = addPrefixesToProperty(property);
  return prefixedProperties.map(prefixedProp => `  ${prefixedProp}: ${value};`).join('\n');
}

function tokenize(css: string): string[] {
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Add spaces around special characters to handle compact formatting
  css = css.replace(/([{};:])/g, ' $1 ');
  // Split into tokens while preserving braces, semicolons and colons
  const tokens: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < css.length; i++) {
    const char = css[i]!; // css[i] is guaranteed to be string due to loop condition
    if ((char === '"' || char === "'") && (!inString || stringChar === char)) {
      inString = !inString;
      stringChar = inString ? char : '';
      current += char;
    } else if (!inString && (char === '{' || char === '}' || char === ';' || char === ':')) {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      tokens.push(char);
      current = '';
    } else if (!inString && /\s/.test(char)) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

export function prefixCss(css: string): string {
  const tokens = tokenize(css);
  let result = '';
  let i = 0;
  let braceLevel = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '{') {
      result += ' {';
      braceLevel++;
      i++;
    } else if (token === '}') {
      result += ' }';
      braceLevel--;
      i++;
      if (i < tokens.length && tokens[i] !== ';' && tokens[i] !== '}' && tokens[i] !== '{') {
        result += '\n';
      }
    } else if (token === ';') {
      result += ';';
      if (braceLevel > 0) {
        result += '\n';
      }
      i++;
    } else if (braceLevel > 0 && i + 1 < tokens.length && tokens[i + 1] === ':') {
      // This is a property
      const property = token ?? '';
      i++; // property
      i++; // skip colon
      let value = '';
      // Collect value until semicolon or brace
      while (i < tokens.length && tokens[i] !== ';' && tokens[i] !== '{' && tokens[i] !== '}') {
        if (value) {
          value += ' ';
        }
        value += tokens[i] ?? '';
        i++;
      }
      value = (value ?? '').trim();
      const processed = processDeclaration(property, value);
      result += processed;
      if (i < tokens.length && tokens[i] === ';') {
        i++; // skip semicolon, already added in processDeclaration
      }
    } else {
      result += token;
      i++;
    }
  }

  // Clean up extra newlines
  result = result.replace(/\n\s*\n/g, '\n');
  const trimmed = result.trim();
  if (trimmed === '') {
    return '';
  }
  return trimmed + (trimmed.endsWith('}') ? '' : '\n');
}
