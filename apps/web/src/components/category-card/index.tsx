import Link from 'next/link';

/**
 * 分类入口卡片组件属性
 */
interface CategoryCardProps {
  /** 分类枚举值，同时用于拼接 /category/{value} 访问路径 */
  value: string;
  /** 分类的中文展示名称 */
  label: string;
}

/**
 * 分类入口卡片，以链接卡片形式引导用户进入指定分类的工具列表
 *
 * @param props - 组件属性
 * @param props.value - 分类枚举值
 * @param props.label - 分类的中文展示名称
 * @returns 指向对应分类页的链接卡片节点
 */
function CategoryCard({ value, label }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${value}`}
      className="flex items-center justify-between rounded-lg border p-5 transition-colors hover:bg-slate-50"
    >
      <span className="font-medium">{label}</span>
      <span className="text-slate-400">→</span>
    </Link>
  );
}

export default CategoryCard;
