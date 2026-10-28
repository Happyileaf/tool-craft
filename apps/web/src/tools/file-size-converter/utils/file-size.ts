/**
 * 字节数 ↔ 人类可读文件大小双向转换（零依赖纯函数）
 *
 * IEC（二进制）：B / KiB / MiB / GiB / TiB / PiB，基数 1024
 * SI（十进制）：B / KB / MB / GB / TB / PB，基数 1000
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type SizeStandard = 'iec' | 'si';

const IEC_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] as const;
const SI_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/** 单位 → 基数因子（同时兼容 KiB 与 KB 两套写法） */
const UNIT_FACTORS: Record<string, number> = {
  B: 1,
  KB: 1000,
  MB: 1000 ** 2,
  GB: 1000 ** 3,
  TB: 1000 ** 4,
  PB: 1000 ** 5,
  KIB: 1024,
  MIB: 1024 ** 2,
  GIB: 1024 ** 3,
  TIB: 1024 ** 4,
  PIB: 1024 ** 5,
};

export interface FormatOptions {
  standard: SizeStandard;
  /** 固定小数位；不传时智能保留至多 2 位并去掉尾零 */
  decimals?: number;
}

export interface SizeResult {
  output: string;
  error: string | null;
}

/**
 * 字节数 → 人类可读字符串：
 * 1023→`1023 B`、1024→`1 KiB`、1536→`1.5 KiB`（IEC）；
 * 1000→`1 KB`、1500→`1.5 KB`（SI）；0→`0 B`。
 */
export function formatBytes(bytes: number, options: FormatOptions): string {
  const base = options.standard === 'iec' ? 1024 : 1000;
  const units = options.standard === 'iec' ? IEC_UNITS : SI_UNITS;
  if (bytes === 0) {
    return '0 B';
  }
  let unitIndex = 0;
  let value = bytes;
  while (value >= base && unitIndex < units.length - 1) {
    value /= base;
    unitIndex += 1;
  }
  const unit = units[unitIndex] ?? 'B';
  if (unitIndex === 0) {
    return `${Math.round(value)} B`;
  }
  let text: string;
  if (options.decimals !== undefined) {
    text = value.toFixed(options.decimals);
  } else {
    text = String(Math.round(value * 100) / 100);
  }
  return `${text} ${unit}`;
}

/**
 * 人类可读字符串 → 字节数：
 * 容忍首尾空白、大小写、数值与单位间空白、千分位逗号；
 * 结果四舍五入为整数字节；非法输入抛错。
 */
export function parseSize(input: string): number {
  const normalized = input.trim().replace(/,/g, '');
  if (normalized === '') {
    throw new Error('内容不能为空');
  }
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([A-Za-z]*)$/.exec(normalized);
  if (!match) {
    throw new Error(`「${input}」无法识别：请输入如 1.5 MB、2048 KiB、3GB 的形式`);
  }
  const value = Number(match[1]);
  const unitRaw = match[2] ?? '';
  if (unitRaw === '') {
    throw new Error('缺少单位：请补充 B、KB/MB/GB（十进制）或 KiB/MiB/GiB（二进制）');
  }
  const factor = UNIT_FACTORS[unitRaw.toUpperCase()];
  if (factor === undefined) {
    throw new Error(
      `未知单位「${unitRaw}」：支持 B、KB/MB/GB/TB/PB（1000）与 KiB/MiB/GiB/TiB/PiB（1024）`,
    );
  }
  if (value < 0) {
    throw new Error('字节数不能为负数');
  }
  if (!Number.isFinite(value)) {
    throw new Error('数值超出可表示范围');
  }
  return Math.round(value * factor);
}

/** 单行转换（方向：format 字节数→字符串 / parse 字符串→字节数） */
export function convertLine(
  line: string,
  direction: 'format' | 'parse',
  options: FormatOptions,
): SizeResult {
  const trimmed = line.trim();
  if (trimmed === '') {
    return { output: '', error: null };
  }
  try {
    if (direction === 'format') {
      if (!/^[+-]?\d+$/.test(trimmed)) {
        throw new Error(`「${line}」不是合法字节数：请输入非负整数`);
      }
      const bytes = Number(trimmed);
      if (bytes < 0) {
        throw new Error('字节数不能为负数');
      }
      return { output: formatBytes(bytes, options), error: null };
    }
    return { output: String(parseSize(trimmed)), error: null };
  } catch (err) {
    return { output: '', error: (err as Error).message };
  }
}

/** 多行批量转换：每行一个值，非法行逐行标注错误且不影响其他行 */
export function convertLines(
  input: string,
  direction: 'format' | 'parse',
  options: FormatOptions,
): { output: string; warnings: string[]; error: null } {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = convertLine(line, direction, options);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
    } else {
      outputs.push(result.output);
    }
  });
  return { output: outputs.join('\n'), warnings, error: null };
}
