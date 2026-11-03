import type { MetaInput, OgType, TwitterCardType } from './utils/meta';

/** og:type 选项 */
export const OG_TYPE_OPTIONS: { value: OgType; label: string }[] = [
  { value: 'website', label: 'website（普通网站）' },
  { value: 'article', label: 'article（文章）' },
  { value: 'profile', label: 'profile（个人主页）' },
  { value: 'book', label: 'book（图书）' },
  { value: 'music.song', label: 'music.song（歌曲）' },
  { value: 'video.movie', label: 'video.movie（电影）' },
];

/** Twitter Card 类型选项 */
export const TWITTER_CARD_OPTIONS: { value: TwitterCardType; label: string }[] = [
  { value: 'summary_large_image', label: 'summary_large_image（大图卡片）' },
  { value: 'summary', label: 'summary（小图卡片）' },
  { value: 'app', label: 'app（应用卡片）' },
  { value: 'player', label: 'player（视频卡片）' },
];

/** 常用 robots 指令 */
export const ROBOTS_PRESETS: string[] = [
  'index, follow',
  'noindex, nofollow',
  'index, nofollow',
  'noindex, follow',
];

/** 空白初始表单 */
export function createEmptyMeta(): MetaInput {
  return {
    title: '',
    description: '',
    url: '',
    siteName: '',
    ogType: 'website',
    locale: 'zh_CN',
    imageUrl: '',
    imageAlt: '',
    imageWidth: '',
    imageHeight: '',
    twitterCard: 'summary_large_image',
    twitterSite: '',
    twitterCreator: '',
    keywords: '',
    author: '',
    robots: '',
  };
}

/** 示例表单 */
export function createSampleMeta(): MetaInput {
  return {
    title: '工具集 — 开发者常用在线工具',
    description:
      '免费、免登录的开发者工具箱：编码解码、格式化、校验与生成器，全部在浏览器本地运行，不上传任何数据。',
    url: 'https://tools.example.com/',
    siteName: 'DevTools',
    ogType: 'website',
    locale: 'zh_CN',
    imageUrl: 'https://tools.example.com/og-cover.png',
    imageAlt: 'DevTools 工具箱首页截图',
    imageWidth: '1200',
    imageHeight: '630',
    twitterCard: 'summary_large_image',
    twitterSite: '@devtools',
    twitterCreator: '@happyileaf',
    keywords: '开发者工具, 编码, 格式化, SEO',
    author: 'DevTools Team',
    robots: 'index, follow',
  };
}
