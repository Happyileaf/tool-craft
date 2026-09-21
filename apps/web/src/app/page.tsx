import CategoryCard from '@/components/category-card';
import EmptyState from '@/components/empty-state';
import RecentTools from '@/components/recent-tools';
import ToolCard from '@/components/tool-card';
import {
  ToolCategoryLabelMap,
  ToolCategoryOptions,
} from '@/tools/constants';
import { tools, getToolsByCategory } from '@/tools/registry';

/**
 * 站点首页，集中展示平台简介、全部分类入口、最近使用记录与各分类下的工具入口
 *
 * @returns 首页完整内容节点
 */
function HomePage() {
  return (
    <main className="container mx-auto space-y-12 px-4 py-12">
      <section className="space-y-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Tool-Craft</h1>
        <p className="text-lg text-slate-500">
          浏览器本地运行的免费工具箱
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">全部分类</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ToolCategoryOptions.map((option) => (
            <CategoryCard
              key={option.value}
              value={option.value}
              label={option.label}
            />
          ))}
        </div>
      </section>

      <RecentTools />

      <section className="space-y-8">
        <h2 className="text-xl font-semibold">全部工具</h2>
        {tools.length === 0 ? (
          <EmptyState message="工具正在准备中" />
        ) : (
          ToolCategoryOptions.map((option) => {
            const categoryTools = getToolsByCategory(option.value);
            if (categoryTools.length === 0) {
              return null;
            }
            return (
              <section key={option.value} className="space-y-4">
                <h3 className="text-base font-medium">
                  {ToolCategoryLabelMap[option.value]}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryTools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </section>
    </main>
  );
}

export default HomePage;
