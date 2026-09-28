// List of properties that need vendor prefixes
const PROPERTIES_NEEDING_PREFIX = new Set([
  'appearance',
  'user-select',
  'box-sizing',
  'backface-visibility',
  'perspective',
  'transform',
  'transition',
  'animation',
  'column-count',
  'column-gap',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'grid',
  'clip-path',
  'filter',
  'hyphens',
  'opacity',
  'outline',
  'overflow-scrolling',
  'text-size-adjust',
  'transform-style',
  'user-select',
  'will-change',
]);

// List of values that need vendor prefixes for specific properties
const VALUE_PREFIX_MAP: Record<string, string[]> = {
  'linear-gradient': ['-webkit-', '-moz-', '-o-'],
  'radial-gradient': ['-webkit-', '-moz-', '-o-'],
  'repeating-linear-gradient': ['-webkit-', '-moz-', '-o-'],
  'repeating-radial-gradient': ['-webkit-', '-moz-', '-o-'],
  'flex': ['-webkit-', '-ms-'],
  'inline-flex': ['-webkit-', '-ms-'],
  'grid': ['-ms-'],
};

const VENDOR_PREFIXES = ['-webkit-', '-moz-', '-ms-', '-o-'];

/**
 * Adds vendor prefixes to CSS properties and values that need them
 */
export function addVendorPrefixes(css: string): string {
  let result = '';
  let currentSelector = '';
  let currentBlock = '';
  let insideBlock = false;
  let braceCount = 0;

  // Split CSS into tokens (simple approach)
  const lines = css.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      result += '\n';
      continue;
    }

    // Check if line contains opening brace
    if (trimmedLine.includes('{')) {
      const [selector, rest] = trimmedLine.split('{', 2);
      currentSelector = selector!.trim();
      insideBlock = true;
      braceCount = 1;
      currentBlock = '';
      if (rest && rest.trim()) {
        currentBlock += rest.trim() + '\n';
      }
      result += `${currentSelector} {\n`;
      continue;
    }

    // If we're inside a block, collect content
    if (insideBlock) {
      braceCount += (trimmedLine.match(/\{/g) || []).length;
      braceCount -= (trimmedLine.match(/\}/g) || []).length;

      if (braceCount === 0) {
        // End of block, process it
        if (trimmedLine.endsWith('}')) {
          currentBlock += trimmedLine.slice(0, -1).trim();
        }
        const processedBlock = processDeclarationBlock(currentBlock);
        result += processedBlock;
        result += '}\n\n';
        insideBlock = false;
        currentBlock = '';
      } else {
        currentBlock += trimmedLine + '\n';
      }
    } else {
      result += line + '\n';
    }
  }

  // If there's an unfinished block (invalid CSS), just add it as-is
  if (insideBlock && currentBlock) {
    result += currentBlock;
  }

  return result.trim();
}

function processDeclarationBlock(block: string): string {
  const lines = block.split('\n');
  let result = '';

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Remove trailing semicolon for processing
    const hasSemicolon = line.endsWith(';');
    if (hasSemicolon) {
      line = line.slice(0, -1);
    }

    // Split into property and value
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      result += `  ${line}${hasSemicolon ? ';' : ''}\n`;
      continue;
    }

    const property = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    // Add prefixed properties if needed
    if (PROPERTIES_NEEDING_PREFIX.has(property)) {
      for (const prefix of VENDOR_PREFIXES) {
        result += `  ${prefix}${property}: ${value};\n`;
      }
    }

    // Check if value needs prefixes
    let needsValuePrefixes = false;
    let prefixesForValue: string[] = [];
    let foundKeyword: string | null = null;
    for (const [keyword, prefixes] of Object.entries(VALUE_PREFIX_MAP)) {
      if (value.includes(keyword)) {
        needsValuePrefixes = true;
        prefixesForValue = prefixes;
        foundKeyword = keyword;
        break;
      }
    }

    if (needsValuePrefixes && foundKeyword) {
      for (const prefix of prefixesForValue) {
        const prefixedValue = value.replace(
          new RegExp(foundKeyword, 'g'),
          prefix + foundKeyword
        );
        result += `  ${property}: ${prefixedValue};\n`;
      }
    }

    // Add the original unprefixed line at the end
    result += `  ${property}: ${value}${hasSemicolon ? ';' : ''}\n`;
  }

  return result;
}