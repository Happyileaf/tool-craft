import { notFound } from 'next/navigation';
import RecentTracker from '@/components/recent-tracker';
import ToolRunner from '@/components/tool-runner';
import ToolWorkspace from '@/components/tool-workspace';
import { getRelatedTools, getToolBySlug, tools } from '@/tools/registry';

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
 * @returns 工作台完整内容；工具不存在时返回 404
 */
async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    notFound();
  }

  const relatedTools = getRelatedTools(tool.slug);

  return (
    <main>
      <ToolWorkspace tool={tool} relatedTools={relatedTools}>
        <ToolRunner slug={tool.slug} />
      </ToolWorkspace>
      <RecentTracker slug={tool.slug} />
    </main>
  );
}

export default ToolDetailPage;
