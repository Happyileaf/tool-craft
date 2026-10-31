/**
 * vCard 名片生成器常量
 */
import type { ContactKind, VCardData } from './utils/vcard';

/** 电话类型选项 */
export const PHONE_KIND_OPTIONS: { label: string; value: ContactKind }[] = [
  { label: '手机', value: 'cell' },
  { label: '住宅', value: 'home' },
  { label: '工作', value: 'work' },
  { label: '其他', value: 'other' },
];

/** 邮箱类型选项 */
export const EMAIL_KIND_OPTIONS: { label: string; value: ContactKind }[] = [
  { label: '工作', value: 'work' },
  { label: '个人', value: 'home' },
  { label: '其他', value: 'other' },
];

/** 一键填入的样例名片 */
export const SAMPLE_CARD: VCardData = {
  fullName: '张小明 (Zhang Xiaoming)',
  name: {
    family: '张',
    given: '小明',
    additional: '',
    prefix: '',
    suffix: '',
  },
  title: '高级工程师',
  organization: '示例科技有限公司',
  department: '平台研发部',
  phones: [
    { value: '+86 138-0000-0000', kind: 'cell' },
    { value: '010-8888-0000', kind: 'work' },
  ],
  emails: [{ value: 'xiaoming.zhang@example.com', kind: 'work' }],
  url: 'https://example.com/~xiaoming',
  address: {
    box: '',
    extended: '',
    street: '中关村大街 1 号',
    locality: '北京',
    region: '北京',
    postalCode: '100080',
    country: '中国',
  },
  birthday: '1990-01-31',
  note: '主要负责开发者工具方向；工作时间 10:00–19:00。',
};
