import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

/**
 * 使用 autoprefixer 给 CSS 添加浏览器前缀
 */
export async function prefixCss(css: string, browsers: string): Promise<string> {
  if (!css.trim()) {
    return '';
  }

  try {
    const result = await postcss([autoprefixer({ overrideBrowserslist: browsers.split(',') })]).process(css, { from: undefined });
    return result.css;
  } catch (error) {
    throw error;
  }
}

export const BROWSER_PRESETS = {
  'default': '> 0.5%, last 2 versions, Firefox ESR, not dead',
  'modern': 'last 2 versions, > 1%, not dead',
  'legacy': 'ie >= 11, > 0.5%, last 2 versions',
};
