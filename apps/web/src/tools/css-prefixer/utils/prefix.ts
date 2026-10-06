import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

export interface PrefixOptions {
  browsers: string;
}

export const prefixCss = async (css: string, options: PrefixOptions): Promise<string> => {
  const processed = await postcss([autoprefixer({ overrideBrowserslist: options.browsers.split(',').map(b => b.trim()) })])
    .process(css, { from: undefined });
  return processed.css;
};
