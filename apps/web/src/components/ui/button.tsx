import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * 按钮支持的视觉风格
 */
type ButtonVariant = 'default' | 'secondary' | 'outline';

/**
 * 按钮支持的尺寸规格
 */
type ButtonSize = 'default' | 'sm' | 'lg';

/**
 * 按钮组件属性，原生按钮属性均会透传给底层 button 元素
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉风格，默认为主按钮样式 */
  variant?: ButtonVariant;
  /** 尺寸规格，默认为常规尺寸 */
  size?: ButtonSize;
}

const baseClasses =
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 bg-transparent hover:bg-slate-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
};

/**
 * 通用按钮组件，支持多种风格与尺寸，未声明的原生按钮属性将直接透传
 *
 * @param props - 按钮组件属性
 * @param props.variant - 视觉风格，缺省时使用主按钮样式
 * @param props.size - 尺寸规格，缺省时使用常规尺寸
 * @param props.className - 追加到基础样式之后的自定义类名，冲突时以后者为准
 * @returns 渲染完成的按钮节点
 */
function Button({
  variant = 'default',
  size = 'default',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export default Button;
