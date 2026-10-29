import type { CommitInput } from './utils/commit';

/** 默认示例表单数据 */
export const DEFAULT_COMMIT_INPUT: CommitInput = {
  type: 'feat',
  scope: 'web',
  subject: 'add dark mode toggle in settings page',
  body: '在设置页新增主题切换入口，支持浅色、深色与跟随系统三种模式。\n首次进入时读取系统偏好自动初始化。',
  breaking: false,
  breakingNote: '',
  issues: 'Closes #128',
  footers: '',
};

/** 快速组合模板 */
export const COMMIT_TEMPLATES: { name: string; data: CommitInput }[] = [
  {
    name: '新功能',
    data: {
      type: 'feat',
      scope: '',
      subject: 'add xxx feature',
      body: '',
      breaking: false,
      breakingNote: '',
      issues: '',
      footers: '',
    },
  },
  {
    name: '修复缺陷',
    data: {
      type: 'fix',
      scope: '',
      subject: 'prevent crash when input is empty',
      body: '',
      breaking: false,
      breakingNote: '',
      issues: 'Fixes #000',
      footers: '',
    },
  },
  {
    name: '破坏性变更',
    data: {
      type: 'feat',
      scope: 'api',
      subject: 'change auth token format',
      body: '新令牌改为 JWT 结构，旧格式不再接受。',
      breaking: true,
      breakingNote: '旧版 token 接口下线，调用方必须重新签发令牌。',
      issues: '',
      footers: '',
    },
  },
];
