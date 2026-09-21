import { useI18n } from './i18n';

/**
 * 将时间戳格式化为相对当前时间的本地化文案
 *
 * @param timestamp - 目标时间的毫秒时间戳
 * @param t - 国际化翻译函数
 * @returns 形如“刚刚”“5 分钟前”的相对时间文案
 */
export function formatTimeAgo(
  timestamp: number,
  t: ReturnType<typeof useI18n>['t'],
) {
  const elapsedMs = Date.now() - timestamp;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  if (elapsedMinutes < 1) {
    return t('library.timeAgoJustNow');
  }
  if (elapsedMinutes < 60) {
    return t('library.timeAgoMinutes', { n: elapsedMinutes });
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return t('library.timeAgoHours', { n: elapsedHours });
  }
  const elapsedDays = Math.floor(elapsedHours / 24);
  return t('library.timeAgoDays', { n: elapsedDays });
}
