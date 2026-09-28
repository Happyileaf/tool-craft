// 常见 CSS 属性需要前缀的列表
const prefixMap: Record<string, string[]> = {
  'appearance': ['-webkit-', '-moz-'],
  'user-select': ['-webkit-', '-moz-', '-ms-'],
  'box-sizing': ['-webkit-', '-moz-'],
  'background-clip': ['-webkit-', '-moz-'],
  'border-radius': ['-webkit-', '-moz-'],
  'box-shadow': [],
  'text-overflow': [],
  'transition': ['-webkit-', '-moz-', '-o-'],
  'transform': ['-webkit-', '-moz-', '-ms-', '-o-'],
  'transform-origin': ['-webkit-', '-moz-', '-ms-', '-o-'],
  'transition-property': ['-webkit-', '-moz-', '-o-'],
  'transition-duration': ['-webkit-', '-moz-', '-o-'],
  'transition-timing-function': ['-webkit-', '-moz-', '-o-'],
  'transition-delay': ['-webkit-', '-moz-', '-o-'],
  'backface-visibility': ['-webkit-', '-moz-'],
  'perspective': ['-webkit-', '-moz-'],
  'perspective-origin': ['-webkit-', '-moz-'],
  'transform-style': ['-webkit-', '-moz-'],
  'flex': ['-webkit-', '-moz-', '-ms-'],
  'flex-grow': ['-webkit-', '-moz-', '-ms-'],
  'flex-shrink': ['-webkit-', '-moz-', '-ms-'],
  'flex-basis': ['-webkit-', '-moz-', '-ms-'],
  'flex-direction': ['-webkit-', '-moz-', '-ms-'],
  'flex-wrap': ['-webkit-', '-moz-', '-ms-'],
  'justify-content': ['-webkit-', '-moz-', '-ms-'],
  'align-items': ['-webkit-', '-moz-', '-ms-'],
  'align-content': ['-webkit-', '-moz-', '-ms-'],
  'order': ['-webkit-', '-moz-', '-ms-'],
  'align-self': ['-webkit-', '-moz-', '-ms-'],
  'column-count': ['-webkit-', '-moz-'],
  'column-gap': ['-webkit-', '-moz-'],
  'column-rule': ['-webkit-', '-moz-'],
  'column-span': ['-webkit-', '-moz-'],
  'column-width': ['-webkit-', '-moz-'],
  'hyphens': ['-webkit-', '-moz-', '-ms-'],
  'text-size-adjust': ['-webkit-', '-moz-', '-ms-'],
  'overflow-scrolling': ['-webkit-'],
  'touch-action': ['-ms-'],
  'will-change': ['-webkit-', '-moz-'],
  'filter': ['-webkit-', '-moz-'],
  'backdrop-filter': ['-webkit-'],
  'clip-path': ['-webkit-'],
  'mask-image': ['-webkit-'],
  'mask-size': ['-webkit-'],
  'mask-position': ['-webkit-'],
  'mask-repeat': ['-webkit-'],
  'mask-origin': ['-webkit-'],
  'mask-clip': ['-webkit-'],
  'mask-composite': ['-webkit-'],
  'grid': ['-webkit-', '-ms-'],
  'grid-template-columns': ['-webkit-', '-ms-'],
  'grid-template-rows': ['-webkit-', '-ms-'],
  'grid-template-areas': ['-webkit-', '-ms-'],
  'grid-template': ['-webkit-', '-ms-'],
  'grid-gap': ['-webkit-', '-ms-'],
  'grid-column-gap': ['-webkit-', '-ms-'],
  'grid-row-gap': ['-webkit-', '-ms-'],
  'grid-column': ['-webkit-', '-ms-'],
  'grid-row': ['-webkit-', '-ms-'],
  'grid-area': ['-webkit-', '-ms-'],
  'place-content': ['-webkit-'],
  'place-items': ['-webkit-'],
  'place-self': ['-webkit-'],
  'gap': ['-webkit-'],
  'row-gap': ['-webkit-'],
  'font-feature-settings': ['-webkit-', '-moz-'],
  'font-kerning': ['-webkit-'],
  'shape-outside': ['-webkit-', '-moz-'],
  'break-inside': ['-webkit-', '-moz-'],
  'object-fit': ['-webkit-', '-moz-'],
  'object-position': ['-webkit-', '-moz-'],
  'initial-letter': ['-webkit-', '-moz-'],
  'aspect-ratio': ['-webkit-'],
  'container-type': ['-webkit-', '-moz-'],
  'container-name': ['-webkit-', '-moz-'],
};

/**
 * 给 CSS 添加浏览器前缀
 */
export function addCssPrefixes(css: string): string {
  if (!css.trim()) {
    return '';
  }

  // 分割成规则块
  let result = css;
  const ruleRegex = /([^{]+)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  // 遍历每个规则块
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1];
    const declarations = match[2];
    const processedDeclarations = processDeclarations(declarations);
    const processedRule = `${selector.trim()} {
${processedDeclarations}
}
`;
    result = result.replace(match[0], processedRule);
  }

  // 处理没有大括号的内联样式
  if (result === css) {
    return processDeclarations(css);
  }

  return result.trim();
}

/**
 * 处理声明块
 */
function processDeclarations(declarations: string): string {
  const lines = declarations.split(';');
  const processedLines: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // 分割属性和值
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      processedLines.push(`  ${line};`);
      continue;
    }

    const property = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    // 获取该属性需要的前缀
    const prefixes = prefixMap[property];
    if (!prefixes || prefixes.length === 0) {
      processedLines.push(`  ${property}: ${value};`);
      continue;
    }

    // 添加标准属性
    processedLines.push(`  ${property}: ${value};`);
    // 添加带前缀的属性
    for (const prefix of prefixes) {
      processedLines.push(`  ${prefix}${property}: ${value};`);
    }
  }

  return processedLines.join('\n');
}
