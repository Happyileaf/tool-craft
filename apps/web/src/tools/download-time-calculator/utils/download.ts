/**
 * 文件下载时间估算（零依赖纯函数）
 *
 * 单位口径与网络速率一致，统一采用十进制：1 KB = 1000 B、1 Mbps = 10⁶ bit/s；
 * 1 byte = 8 bit。耗时（秒）= 文件字节数 × 8 /（带宽 bit/s × 效率系数）。
 * 本模块不触碰 DOM 与 React，非法输入抛出带中文说明的 Error。
 */

export interface UnitOption {
  label: string;
  factor: number;
}

/** 文件大小单位（十进制，1 GB = 10⁹ B） */
export const SIZE_UNITS: UnitOption[] = [
  { label: 'KB', factor: 1e3 },
  { label: 'MB', factor: 1e6 },
  { label: 'GB', factor: 1e9 },
  { label: 'TB', factor: 1e12 },
];

/** 带宽单位（十进制，1 Gbps = 10⁹ bit/s） */
export const BANDWIDTH_UNITS: UnitOption[] = [
  { label: 'Kbps', factor: 1e3 },
  { label: 'Mbps', factor: 1e6 },
  { label: 'Gbps', factor: 1e9 },
];

/** 常见网络档位预设（bit/s） */
export const BANDWIDTH_PRESETS: { label: string; value: number; unit: string }[] = [
  { label: '拨号 56K', value: 56, unit: 'Kbps' },
  { label: 'ADSL 1M', value: 1, unit: 'Mbps' },
  { label: '宽带 10M', value: 10, unit: 'Mbps' },
  { label: '宽带 50M', value: 50, unit: 'Mbps' },
  { label: '宽带 100M', value: 100, unit: 'Mbps' },
  { label: '4G 300M', value: 300, unit: 'Mbps' },
  { label: '宽带 500M', value: 500, unit: 'Mbps' },
  { label: '千兆 1G', value: 1, unit: 'Gbps' },
];

export const BYTES_PER_BIT = 1 / 8;

/**
 * 计算下载耗时（秒）。
 *
 * @param sizeBytes - 文件大小（字节）
 * @param bandwidthBps - 有效带宽（bit/s）
 * @param efficiency - 传输效率系数（0,1]，1 表示理论满速
 * @throws 带宽非正、效率越界等情况抛出中文错误
 */
export function computeDownloadSeconds(
  sizeBytes: number,
  bandwidthBps: number,
  efficiency = 1,
): number {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    throw new Error('文件大小必须为不小于 0 的有效数字');
  }
  if (!Number.isFinite(bandwidthBps) || bandwidthBps <= 0) {
    throw new Error('带宽必须为正数');
  }
  if (!Number.isFinite(efficiency) || efficiency <= 0 || efficiency > 1) {
    throw new Error('效率系数必须在 (0, 1] 区间（即 0%–100%）');
  }
  return (sizeBytes * 8) / (bandwidthBps * efficiency);
}

export interface DurationParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** 把秒数拆成天 / 时 / 分 / 秒（秒四舍五入到整数） */
export function splitDuration(totalSeconds: number): DurationParts {
  const total = Math.round(totalSeconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

/** 两位补零 */
function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** 时钟格式：不足一天为 hh:mm:ss，超过一天为 `N天 hh:mm:ss` */
export function formatClock(totalSeconds: number): string {
  const { days, hours, minutes, seconds } = splitDuration(totalSeconds);
  const clock = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  return days > 0 ? `${days}天 ${clock}` : clock;
}

/** 人类可读时长，如「1 小时 1 分 1 秒」「12 分 32 秒」；不足 1 秒保留两位小数 */
export function formatHuman(totalSeconds: number): string {
  if (totalSeconds < 1) {
    return `${Number(totalSeconds.toFixed(2))} 秒`;
  }
  const { days, hours, minutes, seconds } = splitDuration(totalSeconds);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0) parts.push(`${hours} 小时`);
  if (minutes > 0) parts.push(`${minutes} 分`);
  if (seconds > 0) parts.push(`${seconds} 秒`);
  return parts.length > 0 ? parts.join(' ') : '0 秒';
}

export interface ComparisonRow {
  label: string;
  bandwidthBps: number;
  seconds: number;
  clock: string;
  human: string;
}

/** 对全部常见带宽档位生成对照表 */
export function buildComparisonTable(sizeBytes: number, efficiency = 1): ComparisonRow[] {
  return BANDWIDTH_PRESETS.map((preset) => {
    const unit = BANDWIDTH_UNITS.find((item) => item.label === preset.unit);
    const bandwidthBps = preset.value * (unit?.factor ?? 1);
    const seconds = computeDownloadSeconds(sizeBytes, bandwidthBps, efficiency);
    return {
      label: `${preset.label}（${preset.value} ${preset.unit}）`,
      bandwidthBps,
      seconds,
      clock: formatClock(seconds),
      human: formatHuman(seconds),
    };
  });
}
