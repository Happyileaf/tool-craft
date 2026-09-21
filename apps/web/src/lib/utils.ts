import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并条件类名并解决 Tailwind 工具类冲突
 *
 * @param inputs - 类名或类名条件集合，与 clsx 入参规则一致
 * @returns 冲突消解后的最终类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
