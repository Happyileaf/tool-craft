import Link from 'next/link';
import type { ToolMeta } from '@/tools/types';

/**
 * 工具入口卡片组件属性
 */
interface ToolCardProps {
  /** 待展示的工具元数据，名称与描述取自该对象 */
  tool: ToolMeta;
}

/**
 * 工具入口卡片，展示工具名称与用途说明并链接到工具详情页
 *
 * @param props - 组件属性
 * @param props.tool - 待展示的工具元数据
 * @returns 指向工具详情页的卡片节点
 */
function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="block rounded-lg border p-5 transition-colors hover:bg-slate-50"
    >
      <h3 className="font-medium">{tool.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
        {tool.description}
      </p>
    </Link>
  );
}

export default ToolCard;
