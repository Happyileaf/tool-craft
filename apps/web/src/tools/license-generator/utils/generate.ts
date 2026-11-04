import {
  COPYRIGHT_HOLDER_PLACEHOLDER,
  LICENSES,
  MAX_HOLDER_LENGTH,
  MAX_YEAR,
  MIN_YEAR,
  YEAR_PLACEHOLDER,
} from '../constants';
import { LICENSE_TEMPLATES } from '../licenses';

/**
 * 校验年份是否落在允许区间内
 *
 * @param year - 待校验年份
 * @returns 合法返回 true，否则 false
 */
export function isValidYear(year: number): boolean {
  return (
    Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR
  );
}

/**
 * 校验著作权人名称：去除首尾空白后非空且不超过长度上限
 *
 * @param holder - 待校验名称
 * @returns 合法返回 true，否则 false
 */
export function isValidCopyrightHolder(holder: string): boolean {
  const trimmed = holder.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_HOLDER_LENGTH;
}

/**
 * 判断指定许可证模板是否包含年份/著作权人占位符
 *
 * Unlicense 等公有领域弃权文本不含占位符，无需填充
 *
 * @param licenseId - SPDX 标识符
 * @returns 含占位符返回 true
 */
export function hasPlaceholders(licenseId: string): boolean {
  const template = LICENSE_TEMPLATES[licenseId];
  if (!template) {
    return false;
  }
  return (
    template.includes(YEAR_PLACEHOLDER) ||
    template.includes(COPYRIGHT_HOLDER_PLACEHOLDER) ||
    template.includes('[yyyy]') ||
    template.includes('[name of copyright owner]')
  );
}

/**
 * 生成填充后的许可证全文
 *
 * 仅做字符串占位符替换，不改动模板中的任何法律条款原文；
 * Unlicense 等无占位符模板在参数合法时原样返回。
 *
 * @param licenseId - SPDX 标识符
 * @param year - 著作权年份
 * @param copyrightHolder - 著作权人名称
 * @returns 可直接写入 LICENSE 文件的全文
 * @throws 许可证 id 未知、年份或著作权人非法时抛出错误
 */
export function generateLicense(
  licenseId: string,
  year: number,
  copyrightHolder: string,
): string {
  const template = LICENSE_TEMPLATES[licenseId];
  if (!template) {
    throw new Error(`未知的许可证标识符：${licenseId}`);
  }
  if (hasPlaceholders(licenseId)) {
    if (!isValidYear(year)) {
      throw new Error(
        `年份必须为 ${MIN_YEAR}-${MAX_YEAR} 之间的整数`,
      );
    }
    if (!isValidCopyrightHolder(copyrightHolder)) {
      throw new Error(
        `著作权人名称不能为空且长度不能超过 ${MAX_HOLDER_LENGTH} 个字符`,
      );
    }
  }
  const holder = copyrightHolder.trim();
  return template
    .split(YEAR_PLACEHOLDER)
    .join(String(year))
    .split(COPYRIGHT_HOLDER_PLACEHOLDER)
    .join(holder)
    .split('[yyyy]')
    .join(String(year))
    .split('[name of copyright owner]')
    .join(holder);
}

/**
 * 按 SPDX id 获取许可证展示元数据
 *
 * @param licenseId - SPDX 标识符
 * @returns 元数据对象，未找到时返回 undefined
 */
export function getLicenseMeta(licenseId: string) {
  return LICENSES.find((item) => item.id === licenseId);
}
