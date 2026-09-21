import dynamic from 'next/dynamic';
import { toolLoaders } from '@/tools/loaders';

/**
 * 工具运行区组件属性
 */
interface ToolRunnerProps {
  /** 要渲染的工具短标识，按懒加载映射解析具体实现 */
  slug: string;
}

/**
 * 工具运行区，依据 slug 从懒加载映射中解析并渲染工具实现，未登记实现时给出上线提示
 *
 * @param props - 组件属性
 * @param props.slug - 要渲染的工具短标识
 * @returns 工具实现组件；不存在对应实现时返回「工具即将上线」提示
 */
function ToolRunner({ slug }: ToolRunnerProps) {
  const loader = toolLoaders[slug];
  if (!loader) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-slate-500">
        工具即将上线
      </div>
    );
  }

  const ToolImplementation = dynamic(loader, {
    loading: () => (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        加载中…
      </div>
    ),
  });

  return <ToolImplementation />;
}

export default ToolRunner;
