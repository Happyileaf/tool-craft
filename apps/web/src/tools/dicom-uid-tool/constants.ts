/** 生成器默认组织根：IANA 企业编号分支下的示例私有根 */
export const DEFAULT_ROOT = '1.3.6.1.4.1.99999';

/** 校验器默认样例：合规 UID、Well-known UID 与违规 UID 混合 */
export const DEFAULT_VALIDATE_TEXT = [
  '1.2.840.10008.1.2.1',
  '1.3.6.1.4.1.99999.1700000000000.1',
  '1.02.840.10008',
  '1.2.840..10008',
].join('\n');

/** 单次批量生成 SOP Instance UID 的数量上限（与 utils 保持一致） */
export const MAX_SOP_COUNT = 100;
