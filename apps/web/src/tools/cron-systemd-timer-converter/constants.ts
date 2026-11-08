export const DEFAULT_CRON = '*/5 9-18 * * 1-5';

export const CRON_EXAMPLES: Array<{ label: string; cron: string }> = [
  { label: '每 5 分钟', cron: '*/5 * * * *' },
  { label: '工作日 9:00', cron: '0 9 * * 1-5' },
  { label: '每月 1 日 00:30', cron: '30 0 1 * *' },
  { label: '工作时段每 15 分钟', cron: '*/15 8-18 * * *' },
  { label: '每周五 18:00', cron: '0 18 * * 5' },
];

export const ON_CALENDAR_EXAMPLES: Array<{ label: string; expr: string }> = [
  { label: '每天 0 点', expr: 'daily' },
  { label: '每小时整点', expr: 'hourly' },
  { label: '工作日 9 点', expr: 'Mon..Fri *-*-* 09:00:00' },
  { label: '每月 1 日 00:30', expr: '*-*-01 00:30:00' },
  { label: '每 10 分钟', expr: '*:0/10' },
];

export const RUN_PREVIEW_COUNT = 8;
