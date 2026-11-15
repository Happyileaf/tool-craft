/**
 * 简繁转换工具内常量
 */

/** 转换方向 */
export enum ZhDirectionEnum {
  S2T = 's2t',
  S2TW = 's2tw',
  S2HK = 's2hk',
  T2S = 't2s',
  TW2S = 'tw2s',
  HK2S = 'hk2s',
}

/** 转换方向中文标签 */
export const ZH_DIRECTION_LABELS: Record<ZhDirectionEnum, string> = {
  [ZhDirectionEnum.S2T]: '简体 → 繁体（通用）',
  [ZhDirectionEnum.S2TW]: '简体 → 繁体（台湾）',
  [ZhDirectionEnum.S2HK]: '简体 → 繁体（香港）',
  [ZhDirectionEnum.T2S]: '繁体 → 简体（通用）',
  [ZhDirectionEnum.TW2S]: '台湾繁体 → 简体',
  [ZhDirectionEnum.HK2S]: '香港繁体 → 简体',
};

/** 默认示例文本 */
export const DEFAULT_SAMPLE_INPUT =
  '我们发展软件，整理头发和后台，这里的信息需要同步。Hello 2026!';

/** 与当前方向相反的方向 */
export const REVERSE_DIRECTION: Record<ZhDirectionEnum, ZhDirectionEnum> = {
  [ZhDirectionEnum.S2T]: ZhDirectionEnum.T2S,
  [ZhDirectionEnum.S2TW]: ZhDirectionEnum.TW2S,
  [ZhDirectionEnum.S2HK]: ZhDirectionEnum.HK2S,
  [ZhDirectionEnum.T2S]: ZhDirectionEnum.S2T,
  [ZhDirectionEnum.TW2S]: ZhDirectionEnum.S2TW,
  [ZhDirectionEnum.HK2S]: ZhDirectionEnum.S2HK,
};
