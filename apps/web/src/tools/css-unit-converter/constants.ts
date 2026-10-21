/**
 * CSS 单位换算工具内常量
 */
import { CssUnitEnum, DEFAULT_FONT_SIZE } from './utils/css-unit';

/** 默认输入数值 */
export const DEFAULT_VALUE = '16';

/** 默认源单位 */
export const DEFAULT_SOURCE_UNIT = CssUnitEnum.PX;

/** 默认根字号（rem 基准，px） */
export const DEFAULT_ROOT_FONT_SIZE = String(DEFAULT_FONT_SIZE);

/** 默认父级字号（em 基准，px） */
export const DEFAULT_PARENT_FONT_SIZE = String(DEFAULT_FONT_SIZE);

/** 单位中文标签 */
export const UNIT_LABELS: Record<CssUnitEnum, string> = {
  [CssUnitEnum.PX]: 'px（像素）',
  [CssUnitEnum.REM]: 'rem（根字号倍数）',
  [CssUnitEnum.EM]: 'em（当前字号倍数）',
  [CssUnitEnum.PT]: 'pt（磅）',
};

/** 单位下拉选项 */
export const UNIT_OPTIONS = [
  CssUnitEnum.PX,
  CssUnitEnum.REM,
  CssUnitEnum.EM,
  CssUnitEnum.PT,
].map((unit) => ({ label: UNIT_LABELS[unit], value: unit }));
