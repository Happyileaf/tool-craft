import type { PhaseKey } from './utils/moonPhase';

/** 八相位的主题色与示意文案。 */
export const PHASE_THEME: Readonly<Record<PhaseKey, { color: string; emoji: string }>> = {
  new: { color: '#64748b', emoji: '🌑' },
  'waxing-crescent': { color: '#8b5cf6', emoji: '🌒' },
  'first-quarter': { color: '#2563eb', emoji: '🌓' },
  'waxing-gibbous': { color: '#0891b2', emoji: '🌔' },
  full: { color: '#d97706', emoji: '🌕' },
  'waning-gibbous': { color: '#0d9488', emoji: '🌖' },
  'last-quarter': { color: '#2563eb', emoji: '🌗' },
  'waning-crescent': { color: '#7c3aed', emoji: '🌘' },
};

/** 模型说明（近似值声明）。 */
export const MODEL_NOTE =
  '本工具采用平均朔望月（29.530588853 天）取模模型，以 UTC 2000-01-06 新月为基准，不依赖天文星历表；结果为日级近似，与真实朔望时刻可能有约 ±1 天误差，适合教学与一般查询。';
