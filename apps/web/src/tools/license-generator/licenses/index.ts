/**
 * 许可证模板索引：汇总各许可证全文并按 SPDX id 建立映射
 */
import {
  BSD_2_CLAUSE_TEMPLATE,
  BSD_3_CLAUSE_TEMPLATE,
  ISC_TEMPLATE,
  MIT_TEMPLATE,
  UNLICENSE_TEMPLATE,
} from './permissive';
import { APACHE_2_0_TEMPLATE } from './apache';
import { GPL_3_0_TEMPLATE_PART_1 } from './gpl3-part1';
import { GPL_3_0_TEMPLATE_PART_2 } from './gpl3-part2';

/** GPL-3.0 由两个分块拼接，结果与官方原文逐字一致 */
export const GPL_3_0_TEMPLATE = GPL_3_0_TEMPLATE_PART_1 + GPL_3_0_TEMPLATE_PART_2;

/**
 * SPDX id 到许可证全文模板的映射表
 */
export const LICENSE_TEMPLATES: Record<string, string> = {
  MIT: MIT_TEMPLATE,
  'Apache-2.0': APACHE_2_0_TEMPLATE,
  'BSD-2-Clause': BSD_2_CLAUSE_TEMPLATE,
  'BSD-3-Clause': BSD_3_CLAUSE_TEMPLATE,
  ISC: ISC_TEMPLATE,
  'GPL-3.0': GPL_3_0_TEMPLATE,
  Unlicense: UNLICENSE_TEMPLATE,
};
