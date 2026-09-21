/**
 * 哈希算法枚举，枚举值与 WebCrypto digest 接受的算法名保持一致
 */
export enum HashAlgorithmEnum {
  /** RFC 1321 消息摘要算法，输出 128 位，手写实现 */
  MD5 = 'MD5',
  /** 第一代安全哈希算法，输出 160 位 */
  SHA1 = 'SHA-1',
  /** 当前主流安全哈希算法，输出 256 位 */
  SHA256 = 'SHA-256',
  /** 高安全级哈希算法，输出 512 位 */
  SHA512 = 'SHA-512',
}

/**
 * 哈希算法对应的国际化文案键，键为算法枚举值，值为点分文案路径
 */
export const HashAlgorithmLabelMap: Record<HashAlgorithmEnum, string> = {
  /** MD5 文案键 */
  [HashAlgorithmEnum.MD5]: 'tools.hash.md5',
  /** SHA-1 文案键 */
  [HashAlgorithmEnum.SHA1]: 'tools.hash.sha1',
  /** SHA-256 文案键 */
  [HashAlgorithmEnum.SHA256]: 'tools.hash.sha256',
  /** SHA-512 文案键 */
  [HashAlgorithmEnum.SHA512]: 'tools.hash.sha512',
};

/**
 * 哈希算法的摘要位长映射，取值依据各算法标准定义的输出长度
 */
export const HashAlgorithmBitsMap: Record<HashAlgorithmEnum, number> = {
  /** MD5 输出 128 位 */
  [HashAlgorithmEnum.MD5]: 128,
  /** SHA-1 输出 160 位 */
  [HashAlgorithmEnum.SHA1]: 160,
  /** SHA-256 输出 256 位 */
  [HashAlgorithmEnum.SHA256]: 256,
  /** SHA-512 输出 512 位 */
  [HashAlgorithmEnum.SHA512]: 512,
};

/**
 * 哈希算法选项数据结构，label 存国际化文案键，由组件经 t() 翻译后渲染
 */
interface HashAlgorithmOption {
  /** 面向用户展示的国际化文案键 */
  label: string;
  /** 哈希算法枚举值 */
  value: HashAlgorithmEnum;
}

/**
 * 哈希算法选项数据源，顺序与枚举定义顺序保持一致
 */
export const HashAlgorithmOptions: HashAlgorithmOption[] = Object.values(
  HashAlgorithmEnum,
).map((value) => ({
  label: HashAlgorithmLabelMap[value],
  value,
}));

/**
 * 工具首次载入时填入的样例原文
 */
export const DEFAULT_INPUT =
  'Hello, ToolCraft! 哈希运算完全在本地浏览器进行。';

/**
 * HMAC 区块固定使用的哈希算法，WebCrypto 不支持 HMAC-MD5
 */
export const HMAC_ALGORITHM = HashAlgorithmEnum.SHA256;
