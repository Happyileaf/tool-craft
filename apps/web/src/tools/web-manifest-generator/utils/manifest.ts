/**
 * Web App Manifest 生成纯函数，不依赖 DOM 与 React。
 * 由表单数据拼装 manifest.json（空值省略、2 空格缩进）与 head 引入片段。
 */

/** display 枚举 */
export const DISPLAY_VALUES = ['fullscreen', 'standalone', 'minimal-ui', 'browser'] as const;

/** orientation 枚举 */
export const ORIENTATION_VALUES = [
  'any',
  'natural',
  'portrait',
  'portrait-primary',
  'portrait-secondary',
  'landscape',
  'landscape-primary',
  'landscape-secondary',
] as const;

/** dir 枚举 */
export const DIR_VALUES = ['auto', 'ltr', 'rtl'] as const;

/** 图标 purpose 可选值 */
export const PURPOSE_VALUES = ['any', 'maskable', 'monochrome'] as const;

/** 图标行 */
export interface ManifestIcon {
  /** 图标地址 */
  src: string;
  /** 尺寸声明，如 192x192 / any */
  sizes: string;
  /** MIME 类型，如 image/png */
  type: string;
  /** 已勾选的 purpose */
  purposes: string[];
}

/** 快捷方式 */
export interface ManifestShortcut {
  /** 快捷方式名称 */
  name: string;
  /** 短名称 */
  shortName: string;
  /** 跳转地址（相对或 http(s)） */
  url: string;
  /** 图标地址 */
  iconSrc: string;
  /** 图标尺寸 */
  iconSizes: string;
}

/** 表单数据 */
export interface ManifestForm {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  scope: string;
  display: string;
  orientation: string;
  themeColor: string;
  backgroundColor: string;
  lang: string;
  dir: string;
  id: string;
  categories: string;
  icons: ManifestIcon[];
  shortcuts: ManifestShortcut[];
}

/** 校验结果 */
export interface ManifestValidation {
  /** 错误信息列表 */
  errors: string[];
}

/**
 * 判断字符串是否为合法的 http(s) URL 或以 / 开头的站内相对路径
 *
 * @param value - 待校验文本
 * @returns 合法为 true
 */
export function isManifestUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith('/')) {
    return true;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 校验 CSS 颜色：#rgb / #rrggbb / #rrggbbaa / 具名颜色有限集合 / rgb()/rgba()
 *
 * @param value - 颜色文本
 * @returns 合法（或空）为 true
 */
export function isValidColor(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') {
    return true;
  }
  if (/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return true;
  }
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/.test(trimmed)) {
    return true;
  }
  const named = new Set([
    'black',
    'white',
    'red',
    'green',
    'blue',
    'yellow',
    'orange',
    'purple',
    'pink',
    'gray',
    'grey',
    'transparent',
  ]);
  return named.has(trimmed.toLowerCase());
}

/**
 * 校验表单：name / start_url 必填；颜色与 URL 格式检查
 *
 * @param form - 表单数据
 * @returns 校验结果
 */
export function validateManifest(form: ManifestForm): ManifestValidation {
  const errors: string[] = [];

  if (form.name.trim() === '') {
    errors.push('name（应用名称）为必填项');
  }
  if (form.startUrl.trim() === '') {
    errors.push('start_url（起始页）为必填项');
  } else if (!isManifestUrl(form.startUrl)) {
    errors.push('start_url 必须是 http(s) URL 或以 / 开头的站内路径');
  }

  if (form.scope.trim() !== '' && !isManifestUrl(form.scope)) {
    errors.push('scope 必须是 http(s) URL 或以 / 开头的站内路径');
  }
  if (!isValidColor(form.themeColor)) {
    errors.push('theme_color 颜色格式非法（支持 #rrggbb 或 rgb() 等）');
  }
  if (!isValidColor(form.backgroundColor)) {
    errors.push('background_color 颜色格式非法（支持 #rrggbb 或 rgb() 等）');
  }

  form.icons.forEach((icon, index) => {
    if (icon.src.trim() === '') {
      return;
    }
    if (!isManifestUrl(icon.src)) {
      errors.push(`第 ${index + 1} 个图标 src 必须是 http(s) URL 或以 / 开头的路径`);
    }
  });

  form.shortcuts.forEach((shortcut, index) => {
    if (shortcut.url.trim() !== '' && !isManifestUrl(shortcut.url)) {
      errors.push(`第 ${index + 1} 条 shortcut 的 url 必须是 http(s) URL 或以 / 开头的路径`);
    }
    if (shortcut.iconSrc.trim() !== '' && !isManifestUrl(shortcut.iconSrc)) {
      errors.push(`第 ${index + 1} 条 shortcut 的图标 src 路径非法`);
    }
  });

  return { errors };
}

/** 向目标对象写入非空字符串字段 */
function setIfPresent(
  target: Record<string, unknown>,
  key: string,
  value: string,
): void {
  const trimmed = value.trim();
  if (trimmed !== '') {
    target[key] = trimmed;
  }
}

/**
 * 由表单构建 manifest 对象（空值字段省略，空 src 图标与空 shortcut 过滤）
 *
 * @param form - 表单数据
 * @returns 可直接 JSON.stringify 的 manifest 对象
 */
export function buildManifestObject(form: ManifestForm): Record<string, unknown> {
  const manifest: Record<string, unknown> = {};

  setIfPresent(manifest, 'name', form.name);
  setIfPresent(manifest, 'short_name', form.shortName);
  setIfPresent(manifest, 'description', form.description);
  setIfPresent(manifest, 'id', form.id);
  setIfPresent(manifest, 'start_url', form.startUrl);
  setIfPresent(manifest, 'scope', form.scope);
  setIfPresent(manifest, 'display', form.display);
  setIfPresent(manifest, 'orientation', form.orientation);
  setIfPresent(manifest, 'theme_color', form.themeColor);
  setIfPresent(manifest, 'background_color', form.backgroundColor);
  setIfPresent(manifest, 'lang', form.lang);
  setIfPresent(manifest, 'dir', form.dir);

  const categories = form.categories
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter((item) => item !== '');
  if (categories.length > 0) {
    manifest.categories = categories;
  }

  const icons = form.icons
    .filter((icon) => icon.src.trim() !== '')
    .map((icon) => {
      const entry: Record<string, string> = { src: icon.src.trim() };
      if (icon.sizes.trim() !== '') {
        entry.sizes = icon.sizes.trim();
      }
      if (icon.type.trim() !== '') {
        entry.type = icon.type.trim();
      }
      if (icon.purposes.length > 0) {
        entry.purpose = icon.purposes.join(' ');
      }
      return entry;
    });
  if (icons.length > 0) {
    manifest.icons = icons;
  }

  const shortcuts = form.shortcuts
    .filter((shortcut) => shortcut.name.trim() !== '' && shortcut.url.trim() !== '')
    .map((shortcut) => {
      const entry: Record<string, unknown> = {
        name: shortcut.name.trim(),
        url: shortcut.url.trim(),
      };
      if (shortcut.shortName.trim() !== '') {
        entry.short_name = shortcut.shortName.trim();
      }
      if (shortcut.iconSrc.trim() !== '') {
        const iconEntry: Record<string, string> = { src: shortcut.iconSrc.trim() };
        if (shortcut.iconSizes.trim() !== '') {
          iconEntry.sizes = shortcut.iconSizes.trim();
        }
        entry.icons = [iconEntry];
      }
      return entry;
    });
  if (shortcuts.length > 0) {
    manifest.shortcuts = shortcuts;
  }

  return manifest;
}

/**
 * 生成 2 空格缩进的 manifest.json 文本；全空表单返回空对象字符串
 *
 * @param form - 表单数据
 * @returns JSON 文本
 */
export function buildManifest(form: ManifestForm): string {
  return JSON.stringify(buildManifestObject(form), null, 2);
}

/**
 * 生成需要加入 HTML head 的 link / meta 片段。
 * 始终输出 manifest link；theme_color 非空时追加 theme-color meta。
 *
 * @param form - 表单数据
 * @returns head 片段文本
 */
export function buildHeadSnippet(form: ManifestForm): string {
  const lines = ['<link rel="manifest" href="/manifest.json">'];
  if (form.themeColor.trim() !== '') {
    lines.push(`<meta name="theme-color" content="${form.themeColor.trim()}">`);
  }
  return lines.join('\n');
}
