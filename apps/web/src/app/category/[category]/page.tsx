import { notFound } from 'next/navigation';
import EmptyState from '@/components/empty-state';
import ToolCard from '@/components/tool-card';
import {
  ToolCategoryEnum,
  ToolCategoryLabelMap,
  ToolCategoryOptions,
} from '@/tools/constants';
import { getToolsByCategory } from '@/tools/registry';

/**
 * 分类页动态路由参数
 */
interface CategoryPageProps {
  /** 路由参数，category 为地址中的分类标识 */
  params: Promise<{
    /** 地址段中的分类标识，需与分类枚举值匹配 */
    category: string;
  }>;
}

/**
 * 在构建期枚举全部分类生成静态页面，运行时直接返回预渲染结果而不查询数据源
 *
 * @returns 全部分类对应的路由参数集合
 */
export function generateStaticParams() {
  return ToolCategoryOptions.filter(
    (option) => option.value !== ToolCategoryEnum.ALL,
  ).map((option) => ({
    category: option.value,
  }));
}

/**
 * 分类工具列表页，展示指定分类下的全部工具入口
 *
 * @param props - 页面属性
 * @param props.params - 路由参数 Promise，解析后取得分类标识
 * @returns 分类标题与该分类下的工具卡片集合；分类不存在时返回 404，分类为空时展示空状态
 */
async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const matchedOption = ToolCategoryOptions.find(
    (option) => option.value === category,
  );
  if (!matchedOption || matchedOption.value === ToolCategoryEnum.ALL) {
    notFound();
  }

  const categoryTools = getToolsByCategory(matchedOption.value);

  return (
    <main className="container mx-auto space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold">
        {ToolCategoryLabelMap[matchedOption.value]}
      </h1>
      {categoryTools.length === 0 ? (
        <EmptyState message="该分类下暂无工具" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </main>
  );
}

export default CategoryPage;
