import { css } from 'js-beautify';

export interface BeautifyOptions {
  indentSize: number;
}

export function beautifyCss(cssCode: string, options: BeautifyOptions): string {
  return css(cssCode, {
    indent_size: options.indentSize,
  });
}
