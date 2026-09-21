import Link from 'next/link';
import { getCapabilityGroups } from '@/lib/registry';

/**
 * 能力 id 到工具页路由的映射
 * base64 编码与解码能力共用同一个双向工具页，故有两个 key 指向同一路由
 */
const CAPABILITY_ROUTE_MAP: Record<string, string> = {
  'text.base64-encode': '/tools/base64',
  'text.base64-decode': '/tools/base64',
  'text.url-encode': '/tools/url-encode',
  'data.json-format': '/tools/json-formatter',
  'time.timestamp-convert': '/tools/timestamp',
  'image.resize': '/tools/image-resize',
};

/**
 * 首页：从注册表摘要生成按能力域分组的工具目录
 */
function HomePage() {
  const capabilityGroups = getCapabilityGroups();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">在线工具箱</h1>
        <p className="mt-2 text-sm text-gray-500">
          所有工具均在浏览器本地计算，无需上传，数据不出本机
        </p>
      </section>
      {capabilityGroups.map((group) => (
        <section key={group.domain} className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">{group.domainLabel}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.capabilities.map((capability) => (
              <Link
                key={capability.id}
                href={CAPABILITY_ROUTE_MAP[capability.id] ?? '/'}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
              >
                <h3 className="font-semibold text-gray-900">{capability.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{capability.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default HomePage;
