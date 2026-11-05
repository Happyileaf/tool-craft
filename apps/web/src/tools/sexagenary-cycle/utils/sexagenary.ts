/**
 * 干支纪年（六十甲子）零依赖纯函数模块
 *
 * 口径说明：中国传统干支纪年以立春（节气）为天文学界点，民间也有以春节（农历正月初一）
 * 为界的习惯；本工具采用 year-based 口径——整个公历年对应同一组干支，即公元 4 年为甲子年，
 * 天干索引 (year - 4) mod 10，地支索引 (year - 4) mod 12，六十甲子序号 1..60。
 * 该口径与常见年份对照表、出版物及百科口径一致，但不用于立春/春节当天的精确排盘。
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象返回而非抛出，支持多行批量处理。
 */

export type SexagenaryDirection = 'year-to-ganzhi' | 'ganzhi-to-year';

/** 天干表（索引 0..9） */
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

/** 地支表（索引 0..11） */
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 生肖表，与地支一一对应 */
export const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;

/** 天干五行（甲乙木、丙丁火、戊己土、庚辛金、壬癸水） */
export const STEM_ELEMENTS = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'] as const;

/** 天干阴阳（奇数位为阳，偶数位为阴） */
export const STEM_POLARITIES = ['阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴'] as const;

export interface SexagenaryInfo {
  /** 公历年份（负数表示公元前） */
  year: number;
  /** 天干，如「甲」 */
  stem: string;
  /** 地支，如「子」 */
  branch: string;
  /** 干支组合，如「甲子」 */
  ganzhi: string;
  /** 六十甲子序号，1..60 */
  cycleIndex: number;
  /** 生肖，如「鼠」 */
  zodiac: string;
  /** 五行（以天干论），如「木」 */
  element: string;
  /** 阴阳（以天干论） */
  polarity: string;
}

export interface SexagenaryResult {
  valid: boolean;
  /** 主输出文本：正向为干支组合，反向为匹配年份列表 */
  output: string;
  /** 正向解析出的完整干支信息；反向行为空数组 */
  info: SexagenaryInfo | null;
  /** 反向匹配到的年份列表 */
  years: number[];
  error: string | null;
}

/** 取模并归一化到 [0, modulus)，正确处理负数（公元前年份） */
function mod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

/** 公历年 → 干支完整信息 */
export function yearToGanzhi(year: number): SexagenaryInfo {
  const stemIndex = mod(year - 4, 10);
  const branchIndex = mod(year - 4, 12);
  // 六十甲子序号：(stemIndex, branchIndex) 奇偶必须一致；序号从 1 起
  const cycleIndex = mod(year - 4, 60) + 1;
  return {
    year,
    stem: STEMS[stemIndex]!,
    branch: BRANCHES[branchIndex]!,
    ganzhi: `${STEMS[stemIndex]}${BRANCHES[branchIndex]}`,
    cycleIndex,
    zodiac: ZODIACS[branchIndex]!,
    element: STEM_ELEMENTS[stemIndex]!,
    polarity: STEM_POLARITIES[stemIndex]!,
  };
}

/** 解析单行公历年输入：支持「前 72」/「公元前 72」表示负数年 */
function parseYearLine(rawLine: string): number | string {
  const trimmed = rawLine.trim();
  if (trimmed === '') return '内容不能为空';
  const bceMatch = trimmed.match(/^(?:前|公元前)\s*(-?\d+)$/);
  if (bceMatch) {
    const n = Number(bceMatch[1]);
    if (n <= 0) return '公元前年份必须为正整数';
    return -n;
  }
  if (!/^-?\d+$/.test(trimmed)) return '只能输入整数公历年（公元前可用「前 72」形式）';
  const year = Number(trimmed);
  if (year === 0) return '公历没有公元 0 年：公元前 1 年的下一年即公元 1 年';
  return year;
}

/** 正向批量：每行一个公历年 */
export function yearsToGanzhiBatch(rawBatch: string): SexagenaryResult[] {
  return rawBatch
    .split(/\r?\n/)
    .map((line): SexagenaryResult | null => {
      if (line.trim() === '') return null;
      const parsed = parseYearLine(line);
      if (typeof parsed === 'string') {
        return { valid: false, output: '', info: null, years: [], error: parsed };
      }
      const info = yearToGanzhi(parsed);
      return {
        valid: true,
        output: info.ganzhi,
        info,
        years: [],
        error: null,
      };
    })
    .filter((result): result is SexagenaryResult => result !== null);
}

/** 六十甲子序号（1..60）→ 干支组合 */
export function cycleIndexToGanzhi(index: number): { stem: string; branch: string; ganzhi: string } {
  const zeroBased = index - 1;
  const stem = STEMS[mod(zeroBased, 10)]!;
  const branch = BRANCHES[mod(zeroBased, 12)]!;
  return { stem, branch, ganzhi: `${stem}${branch}` };
}

/** 解析反向查询输入：纯数字为六十甲子序号，两个汉字为干支组合 */
function parseReverseQuery(rawLine: string):
  | { kind: 'index'; index: number }
  | { kind: 'combo'; stemIndex: number; branchIndex: number }
  | string {
  const trimmed = rawLine.trim();
  if (trimmed === '') return '内容不能为空';
  if (/^\d+$/.test(trimmed)) {
    const index = Number(trimmed);
    if (index < 1 || index > 60) return '六十甲子序号必须在 1..60 之间';
    return { kind: 'index', index };
  }
  const chars = [...trimmed];
  if (chars.length !== 2) return '请输入两个汉字的干支组合（如「甲子」）或 1..60 的甲子序号';
  const stemIndex = STEMS.indexOf(chars[0] as (typeof STEMS)[number]);
  const branchIndex = BRANCHES.indexOf(chars[1] as (typeof BRANCHES)[number]);
  if (stemIndex === -1) return `「${chars[0]}」不是有效天干（甲–癸）`;
  if (branchIndex === -1) return `「${chars[1]}」不是有效地支（子–亥）`;
  if (stemIndex % 2 !== branchIndex % 2) {
    return `「${chars[0]}${chars[1]}」不是合法干支组合：天干地支奇偶（阴阳）必须一致，六十甲子中不存在该组合`;
  }
  return { kind: 'combo', stemIndex, branchIndex };
}

/** 在闭区间 [fromYear, toYear] 内查找目标干支（以 stem/branch 索引表示）对应的全部公历年 */
export function findYears(
  stemIndex: number,
  branchIndex: number,
  fromYear: number,
  toYear: number,
): number[] {
  if (fromYear > toYear) return [];
  const years: number[] = [];
  for (let year = fromYear; year <= toYear; year += 1) {
    if (mod(year - 4, 10) === stemIndex && mod(year - 4, 12) === branchIndex) {
      years.push(year);
    }
  }
  return years;
}

/** 反向批量：每行一个甲子序号或干支组合，区间参数对全部行生效 */
export function ganzhiToYearsBatch(
  rawBatch: string,
  fromYear: number,
  toYear: number,
): SexagenaryResult[] {
  if (fromYear > toYear) {
    return [
      {
        valid: false,
        output: '',
        info: null,
        years: [],
        error: '查询区间无效：起始年不能晚于结束年',
      },
    ];
  }
  return rawBatch
    .split(/\r?\n/)
    .map((line): SexagenaryResult | null => {
      if (line.trim() === '') return null;
      const parsed = parseReverseQuery(line);
      if (typeof parsed === 'string') {
        return { valid: false, output: '', info: null, years: [], error: parsed };
      }
      const stemIndex = parsed.kind === 'index' ? mod(parsed.index - 1, 10) : parsed.stemIndex;
      const branchIndex = parsed.kind === 'index' ? mod(parsed.index - 1, 12) : parsed.branchIndex;
      const years = findYears(stemIndex, branchIndex, fromYear, toYear);
      const ganzhi = `${STEMS[stemIndex]}${BRANCHES[branchIndex]}`;
      return {
        valid: true,
        output: years.length > 0 ? years.join(', ') : `区间 ${fromYear}–${toYear} 内无 ${ganzhi} 年`,
        info: null,
        years,
        error: years.length === 0 ? `区间内无 ${ganzhi} 年` : null,
      };
    })
    .filter((result): result is SexagenaryResult => result !== null);
}

/** 生成完整六十甲子循环表（序号 1..60） */
export function buildCycleTable(): SexagenaryInfo[] {
  return Array.from({ length: 60 }, (_, index) => {
    const stemIndex = mod(index, 10);
    const branchIndex = mod(index, 12);
    return {
      year: 0,
      stem: STEMS[stemIndex]!,
      branch: BRANCHES[branchIndex]!,
      ganzhi: `${STEMS[stemIndex]}${BRANCHES[branchIndex]}`,
      cycleIndex: index + 1,
      zodiac: ZODIACS[branchIndex]!,
      element: STEM_ELEMENTS[stemIndex]!,
      polarity: STEM_POLARITIES[stemIndex]!,
    };
  });
}
