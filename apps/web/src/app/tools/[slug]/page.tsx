import { notFound } from 'next/navigation';
import RecentTracker from '@/components/recent-tracker';
import ToolRunner from '@/components/tool-runner';
import {
  ToolCategoryLabelMap,
  ToolProcessingLabelMap,
} from '@/tools/constants';
import { getToolBySlug, tools } from '@/tools/registry';

/**
 * 工具详情页动态路由参数
 */
interface ToolDetailPageProps {
  /** 路由参数，slug 为地址中的工具短标识 */
  params: Promise<{
    /** 地址段中的工具短标识，需与注册表条目匹配 */
    slug: string;
  }>;
}

/**
 * 在构建期依据注册表枚举全部工具生成静态页面，运行时不查询数据源
 *
 * @returns 全部已注册工具对应的路由参数集合
 */
export function generateStaticParams() {
  return tools.map((tool) => ({
    slug: tool.slug,
  }));
}

/**
 * 工具详情页，展示工具基础信息并承载工具实现的运行区域
 *
 * @param props - 页面属性
 * @param props.params - 路由参数 Promise，解析后取得工具短标识
 * @returns 工具名称、描述、分类与处理方式标签以及工具运行区；工具不存在时返回 404
 */
async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    notFound();
  }

  return (
    <main className="container mx-auto space-y-8 px-4 py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">{tool.name}</h1>
        <p className="text-slate-500">{tool.description}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {ToolCategoryLabelMap[tool.category]}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {ToolProcessingLabelMap[tool.processing]}
          </span>
        </div>
      </section>
      <ToolRunner slug={tool.slug} />
      <RecentTracker slug={tool.slug} />
    </main>
  );
}

export default ToolDetailPage;
