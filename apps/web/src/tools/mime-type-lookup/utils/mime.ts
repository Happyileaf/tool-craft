/**
 * MIME 类型速查：内置长期稳定的常用 MIME 静态映射与纯函数查询逻辑，零运行时依赖。
 */

/** MIME 主类型 */
export type MimePrimaryType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'application'
  | 'font'
  | 'model'
  | 'multipart';

/** MIME 条目 */
export interface MimeEntry {
  /** 标准 MIME 类型，如 application/json */
  type: string;
  /** 关联扩展名（不含点，小写），首个为推荐扩展名，可为空（如 multipart/form-data） */
  extensions: string[];
  /** 主类型 */
  primary: MimePrimaryType;
  /** 中文名称 */
  nameZh: string;
  /** 英文名称 / 关键词 */
  nameEn: string;
  /** 额外检索关键词（小写） */
  keywords: string[];
  /** charset 参数示例，仅文本类给出 */
  charset?: string;
  /** 是否属于可安全内联展示的类型 */
  inlineSafe: boolean;
}

/**
 * 内置 MIME 条目（约 50 条长期稳定的常用映射）。
 */
export const MIME_ENTRIES: MimeEntry[] = [
  {
    type: 'text/plain',
    extensions: ['txt', 'text', 'md', 'log'],
    primary: 'text',
    nameZh: '纯文本',
    nameEn: 'Plain Text',
    keywords: ['文本', 'text', 'plain', 'markdown'],
    charset: 'UTF-8',
    inlineSafe: true,
  },
  {
    type: 'text/html',
    extensions: ['html', 'htm', 'xhtml'],
    primary: 'text',
    nameZh: 'HTML 网页',
    nameEn: 'HTML Document',
    keywords: ['网页', 'html', 'web', '页面'],
    charset: 'UTF-8',
    inlineSafe: true,
  },
  {
    type: 'text/css',
    extensions: ['css'],
    primary: 'text',
    nameZh: 'CSS 样式表',
    nameEn: 'Cascading Style Sheet',
    keywords: ['样式', 'css', 'stylesheet'],
    charset: 'UTF-8',
    inlineSafe: true,
  },
  {
    type: 'text/csv',
    extensions: ['csv'],
    primary: 'text',
    nameZh: 'CSV 表格',
    nameEn: 'Comma-Separated Values',
    keywords: ['表格', 'csv', '逗号'],
    charset: 'UTF-8',
    inlineSafe: false,
  },
  {
    type: 'text/javascript',
    extensions: ['js', 'mjs', 'cjs'],
    primary: 'text',
    nameZh: 'JavaScript 脚本',
    nameEn: 'JavaScript',
    keywords: ['脚本', 'javascript', 'js', 'ecmascript'],
    charset: 'UTF-8',
    inlineSafe: false,
  },
  {
    type: 'image/png',
    extensions: ['png'],
    primary: 'image',
    nameZh: 'PNG 图像',
    nameEn: 'PNG Image',
    keywords: ['图片', '图像', 'image', 'png', '位图', '无损'],
    inlineSafe: true,
  },
  {
    type: 'image/jpeg',
    extensions: ['jpeg', 'jpg', 'jfif'],
    primary: 'image',
    nameZh: 'JPEG 图像',
    nameEn: 'JPEG Image',
    keywords: ['图片', '图像', 'image', 'jpeg', 'jpg', '照片'],
    inlineSafe: true,
  },
  {
    type: 'image/gif',
    extensions: ['gif'],
    primary: 'image',
    nameZh: 'GIF 动图',
    nameEn: 'GIF Image',
    keywords: ['图片', '动图', 'image', 'gif', '动画'],
    inlineSafe: true,
  },
  {
    type: 'image/webp',
    extensions: ['webp'],
    primary: 'image',
    nameZh: 'WebP 图像',
    nameEn: 'WebP Image',
    keywords: ['图片', '图像', 'image', 'webp'],
    inlineSafe: true,
  },
  {
    type: 'image/svg+xml',
    extensions: ['svg', 'svgz'],
    primary: 'image',
    nameZh: 'SVG 矢量图',
    nameEn: 'Scalable Vector Graphics',
    keywords: ['图片', '矢量', 'image', 'svg', 'vector'],
    inlineSafe: true,
  },
  {
    type: 'image/x-icon',
    extensions: ['ico', 'cur'],
    primary: 'image',
    nameZh: '图标文件',
    nameEn: 'Icon File',
    keywords: ['图片', '图标', 'image', 'icon', 'favicon'],
    inlineSafe: false,
  },
  {
    type: 'image/bmp',
    extensions: ['bmp', 'dib'],
    primary: 'image',
    nameZh: 'BMP 位图',
    nameEn: 'Bitmap Image',
    keywords: ['图片', '位图', 'image', 'bmp', 'bitmap'],
    inlineSafe: false,
  },
  {
    type: 'image/avif',
    extensions: ['avif'],
    primary: 'image',
    nameZh: 'AVIF 图像',
    nameEn: 'AVIF Image',
    keywords: ['图片', '图像', 'image', 'avif'],
    inlineSafe: true,
  },
  {
    type: 'image/tiff',
    extensions: ['tiff', 'tif'],
    primary: 'image',
    nameZh: 'TIFF 图像',
    nameEn: 'TIFF Image',
    keywords: ['图片', '图像', 'image', 'tiff'],
    inlineSafe: false,
  },
  {
    type: 'audio/mpeg',
    extensions: ['mp3', 'mpga', 'mp2'],
    primary: 'audio',
    nameZh: 'MP3 音频',
    nameEn: 'MP3 Audio',
    keywords: ['音频', '声音', 'audio', 'mp3', 'mpeg'],
    inlineSafe: false,
  },
  {
    type: 'audio/wav',
    extensions: ['wav'],
    primary: 'audio',
    nameZh: 'WAV 音频',
    nameEn: 'Waveform Audio',
    keywords: ['音频', '声音', 'audio', 'wav', 'wave'],
    inlineSafe: false,
  },
  {
    type: 'audio/ogg',
    extensions: ['oga', 'ogg', 'opus', 'spx'],
    primary: 'audio',
    nameZh: 'OGG 音频',
    nameEn: 'OGG Audio',
    keywords: ['音频', '声音', 'audio', 'ogg', 'opus'],
    inlineSafe: false,
  },
  {
    type: 'audio/flac',
    extensions: ['flac'],
    primary: 'audio',
    nameZh: 'FLAC 无损音频',
    nameEn: 'FLAC Audio',
    keywords: ['音频', '无损', 'audio', 'flac'],
    inlineSafe: false,
  },
  {
    type: 'audio/aac',
    extensions: ['aac'],
    primary: 'audio',
    nameZh: 'AAC 音频',
    nameEn: 'AAC Audio',
    keywords: ['音频', '声音', 'audio', 'aac'],
    inlineSafe: false,
  },
  {
    type: 'video/mp4',
    extensions: ['mp4', 'm4v', 'mp4v'],
    primary: 'video',
    nameZh: 'MP4 视频',
    nameEn: 'MP4 Video',
    keywords: ['视频', '影音', 'video', 'mp4'],
    inlineSafe: false,
  },
  {
    type: 'video/mpeg',
    extensions: ['mpeg', 'mpg', 'mpe'],
    primary: 'video',
    nameZh: 'MPEG 视频',
    nameEn: 'MPEG Video',
    keywords: ['视频', '影音', 'video', 'mpeg', 'mpg'],
    inlineSafe: false,
  },
  {
    type: 'video/webm',
    extensions: ['webm'],
    primary: 'video',
    nameZh: 'WebM 视频',
    nameEn: 'WebM Video',
    keywords: ['视频', '影音', 'video', 'webm'],
    inlineSafe: false,
  },
  {
    type: 'video/ogg',
    extensions: ['ogv'],
    primary: 'video',
    nameZh: 'OGG 视频',
    nameEn: 'OGG Video',
    keywords: ['视频', '影音', 'video', 'ogv', 'ogg'],
    inlineSafe: false,
  },
  {
    type: 'video/quicktime',
    extensions: ['mov', 'qt'],
    primary: 'video',
    nameZh: 'QuickTime 视频',
    nameEn: 'QuickTime Video',
    keywords: ['视频', '影音', 'video', 'quicktime', 'mov'],
    inlineSafe: false,
  },
  {
    type: 'font/ttf',
    extensions: ['ttf'],
    primary: 'font',
    nameZh: 'TrueType 字体',
    nameEn: 'TrueType Font',
    keywords: ['字体', 'font', 'ttf', 'truetype'],
    inlineSafe: false,
  },
  {
    type: 'font/otf',
    extensions: ['otf'],
    primary: 'font',
    nameZh: 'OpenType 字体',
    nameEn: 'OpenType Font',
    keywords: ['字体', 'font', 'otf', 'opentype'],
    inlineSafe: false,
  },
  {
    type: 'font/woff',
    extensions: ['woff'],
    primary: 'font',
    nameZh: 'WOFF 网页字体',
    nameEn: 'Web Open Font Format',
    keywords: ['字体', '网页字体', 'font', 'woff'],
    inlineSafe: false,
  },
  {
    type: 'font/woff2',
    extensions: ['woff2'],
    primary: 'font',
    nameZh: 'WOFF2 网页字体',
    nameEn: 'WOFF2 Font',
    keywords: ['字体', '网页字体', 'font', 'woff2'],
    inlineSafe: false,
  },
  {
    type: 'model/gltf-binary',
    extensions: ['glb'],
    primary: 'model',
    nameZh: '二进制 glTF 模型',
    nameEn: 'Binary glTF Model',
    keywords: ['模型', '3d', 'model', 'gltf', 'glb'],
    inlineSafe: false,
  },
  {
    type: 'model/gltf+json',
    extensions: ['gltf'],
    primary: 'model',
    nameZh: 'glTF 模型',
    nameEn: 'glTF Model',
    keywords: ['模型', '3d', 'model', 'gltf'],
    inlineSafe: false,
  },
  {
    type: 'model/stl',
    extensions: ['stl'],
    primary: 'model',
    nameZh: 'STL 三维模型',
    nameEn: 'STL 3D Model',
    keywords: ['模型', '3d', '打印', 'model', 'stl'],
    inlineSafe: false,
  },
  {
    type: 'multipart/form-data',
    extensions: [],
    primary: 'multipart',
    nameZh: '表单文件上传',
    nameEn: 'Form Data (Multipart)',
    keywords: ['表单', '上传', 'form', 'upload', 'multipart'],
    inlineSafe: false,
  },
  {
    type: 'application/json',
    extensions: ['json', 'map'],
    primary: 'application',
    nameZh: 'JSON 数据',
    nameEn: 'JSON Data',
    keywords: ['数据', '接口', 'json', 'api'],
    inlineSafe: false,
  },
  {
    type: 'application/xml',
    extensions: ['xml', 'xsl'],
    primary: 'application',
    nameZh: 'XML 数据',
    nameEn: 'XML Data',
    keywords: ['数据', '配置', 'xml'],
    inlineSafe: false,
  },
  {
    type: 'application/javascript',
    extensions: ['js'],
    primary: 'application',
    nameZh: 'JavaScript（旧标）',
    nameEn: 'JavaScript (Legacy)',
    keywords: ['脚本', 'javascript', 'js'],
    inlineSafe: false,
  },
  {
    type: 'application/pdf',
    extensions: ['pdf'],
    primary: 'application',
    nameZh: 'PDF 文档',
    nameEn: 'PDF Document',
    keywords: ['文档', 'pdf', 'document', '便携'],
    inlineSafe: true,
  },
  {
    type: 'application/zip',
    extensions: ['zip'],
    primary: 'application',
    nameZh: 'ZIP 压缩包',
    nameEn: 'ZIP Archive',
    keywords: ['压缩', '归档', 'zip', 'archive'],
    inlineSafe: false,
  },
  {
    type: 'application/gzip',
    extensions: ['gz', 'gzip'],
    primary: 'application',
    nameZh: 'GZip 压缩',
    nameEn: 'GZip Compressed File',
    keywords: ['压缩', 'gzip', 'gz', 'tar.gz'],
    inlineSafe: false,
  },
  {
    type: 'application/x-tar',
    extensions: ['tar'],
    primary: 'application',
    nameZh: 'TAR 归档',
    nameEn: 'TAR Archive',
    keywords: ['压缩', '归档', 'tar'],
    inlineSafe: false,
  },
  {
    type: 'application/x-7z-compressed',
    extensions: ['7z'],
    primary: 'application',
    nameZh: '7-Zip 压缩包',
    nameEn: '7-Zip Archive',
    keywords: ['压缩', '归档', '7z', '7zip'],
    inlineSafe: false,
  },
  {
    type: 'application/x-rar-compressed',
    extensions: ['rar'],
    primary: 'application',
    nameZh: 'RAR 压缩包',
    nameEn: 'RAR Archive',
    keywords: ['压缩', '归档', 'rar', 'winrar'],
    inlineSafe: false,
  },
  {
    type: 'application/octet-stream',
    extensions: ['bin', 'exe', 'dll', 'so', 'class', 'iso'],
    primary: 'application',
    nameZh: '二进制数据流',
    nameEn: 'Binary Data (Octet Stream)',
    keywords: ['二进制', '下载', 'binary', 'octet', 'exe', '可执行'],
    inlineSafe: false,
  },
  {
    type: 'application/x-www-form-urlencoded',
    extensions: [],
    primary: 'application',
    nameZh: 'URL 编码表单',
    nameEn: 'URL-Encoded Form',
    keywords: ['表单', 'form', 'urlencoded', 'post'],
    inlineSafe: false,
  },
  {
    type: 'application/wasm',
    extensions: ['wasm'],
    primary: 'application',
    nameZh: 'WebAssembly',
    nameEn: 'WebAssembly',
    keywords: ['wasm', 'webassembly', '字节码'],
    inlineSafe: false,
  },
  {
    type: 'application/ld+json',
    extensions: ['jsonld'],
    primary: 'application',
    nameZh: 'JSON-LD 关联数据',
    nameEn: 'JSON-LD',
    keywords: ['json', 'ld', '语义', '结构化数据'],
    inlineSafe: false,
  },
  {
    type: 'application/grpc',
    extensions: [],
    primary: 'application',
    nameZh: 'gRPC 调用',
    nameEn: 'gRPC',
    keywords: ['grpc', 'rpc', 'protobuf', '微服务'],
    inlineSafe: false,
  },
  {
    type: 'application/rtf',
    extensions: ['rtf'],
    primary: 'application',
    nameZh: '富文本 RTF',
    nameEn: 'Rich Text Format',
    keywords: ['文档', '富文本', 'rtf', 'word'],
    inlineSafe: false,
  },
  {
    type: 'application/epub+zip',
    extensions: ['epub'],
    primary: 'application',
    nameZh: 'EPUB 电子书',
    nameEn: 'EPUB eBook',
    keywords: ['电子书', 'epub', 'ebook'],
    inlineSafe: false,
  },
  {
    type: 'application/sql',
    extensions: ['sql'],
    primary: 'application',
    nameZh: 'SQL 脚本',
    nameEn: 'SQL Script',
    keywords: ['数据库', 'sql', '脚本'],
    inlineSafe: false,
  },
  {
    type: 'application/vnd.ms-excel',
    extensions: ['xls', 'xla', 'xlt'],
    primary: 'application',
    nameZh: 'Excel 工作簿（旧）',
    nameEn: 'Microsoft Excel (Legacy)',
    keywords: ['表格', 'excel', 'office', 'xls', '微软'],
    inlineSafe: false,
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    primary: 'application',
    nameZh: 'Excel 工作簿',
    nameEn: 'Microsoft Excel',
    keywords: ['表格', 'excel', 'office', 'xlsx', '微软'],
    inlineSafe: false,
  },
  {
    type: 'application/msword',
    extensions: ['doc', 'dot'],
    primary: 'application',
    nameZh: 'Word 文档（旧）',
    nameEn: 'Microsoft Word (Legacy)',
    keywords: ['文档', 'word', 'office', 'doc', '微软'],
    inlineSafe: false,
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    primary: 'application',
    nameZh: 'Word 文档',
    nameEn: 'Microsoft Word',
    keywords: ['文档', 'word', 'office', 'docx', '微软'],
    inlineSafe: false,
  },
  {
    type: 'application/vnd.ms-powerpoint',
    extensions: ['ppt', 'pps', 'pot'],
    primary: 'application',
    nameZh: 'PowerPoint 演示（旧）',
    nameEn: 'Microsoft PowerPoint (Legacy)',
    keywords: ['演示', '幻灯', 'powerpoint', 'ppt', 'office', '微软'],
    inlineSafe: false,
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pptx'],
    primary: 'application',
    nameZh: 'PowerPoint 演示',
    nameEn: 'Microsoft PowerPoint',
    keywords: ['演示', '幻灯', 'powerpoint', 'pptx', 'office', '微软'],
    inlineSafe: false,
  },
];

/** 扩展名 → MIME 条目索引（小写扩展名，取首个登记该扩展名的条目） */
const EXTENSION_INDEX: Map<string, MimeEntry> = MIME_ENTRIES.reduce(
  (map, entry) => {
    for (const ext of entry.extensions) {
      if (!map.has(ext)) {
        map.set(ext, entry);
      }
    }
    return map;
  },
  new Map<string, MimeEntry>(),
);

/**
 * 规整扩展名输入：去空白、去前导点、转小写。
 *
 * @param input - 原始扩展名（可含或不含点）
 * @returns 规整后的扩展名；输入为空时返回空字符串
 */
export function normalizeExtension(input: string): string {
  return input.trim().replace(/^\.+/, '').toLowerCase();
}

/**
 * 按文件扩展名查找 MIME 条目。
 *
 * @param input - 扩展名（`.json`、`json`、`JSON` 均可）
 * @returns 匹配的 MIME 条目；未知扩展名返回 null
 */
export function lookupByExtension(input: string): MimeEntry | null {
  const ext = normalizeExtension(input);
  if (!ext) {
    return null;
  }
  return EXTENSION_INDEX.get(ext) ?? null;
}

/**
 * 按 MIME 类型精确查找条目。
 *
 * @param type - MIME 类型（大小写不敏感，忽略参数部分）
 * @returns 匹配的 MIME 条目；未知返回 null
 */
export function lookupByType(type: string): MimeEntry | null {
  const normalized = (type.trim().split(';')[0] ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return MIME_ENTRIES.find((entry) => entry.type === normalized) ?? null;
}

/**
 * 判断单个条目是否命中关键词（MIME 字符串、中文名、英文名、扩展名、关键词任一包含）。
 *
 * @param entry - MIME 条目
 * @param keyword - 已转小写的关键词
 * @returns 是否命中
 */
function matchesKeyword(entry: MimeEntry, keyword: string): boolean {
  if (entry.type.includes(keyword)) {
    return true;
  }
  if (entry.nameZh.includes(keyword) || entry.nameEn.toLowerCase().includes(keyword)) {
    return true;
  }
  if (entry.extensions.some((ext) => ext.includes(keyword))) {
    return true;
  }
  return entry.keywords.some((word) => word.includes(keyword));
}

/**
 * 按关键词模糊检索 MIME 条目；关键词为扩展名（如 .jpg）时等价于精确反查。
 *
 * @param keyword - 搜索词（大小写不敏感）
 * @returns 命中的条目集合（保持内置顺序）
 */
export function searchMime(keyword: string): MimeEntry[] {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return MIME_ENTRIES;
  }
  const byExtension = EXTENSION_INDEX.get(normalizeExtension(normalized));
  if (byExtension) {
    return [byExtension];
  }
  return MIME_ENTRIES.filter((entry) => matchesKeyword(entry, normalized));
}

/**
 * 按主类型分组。
 *
 * @param entries - 待分组条目
 * @returns 主类型 → 条目的映射（按 MIME_ENTRIES 内置主类型出现顺序）
 */
export function groupByPrimary(entries: MimeEntry[]): Partial<Record<MimePrimaryType, MimeEntry[]>> {
  return entries.reduce<Partial<Record<MimePrimaryType, MimeEntry[]>>>((groups, entry) => {
    const list = groups[entry.primary] ?? [];
    list.push(entry);
    groups[entry.primary] = list;
    return groups;
  }, {});
}
