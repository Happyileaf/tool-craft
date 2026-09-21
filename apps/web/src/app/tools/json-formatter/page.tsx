import type { Metadata } from 'next';
import JsonFormatterTool from '@/components/json-formatter-tool';

/**
 * JSON 格式化工具页
 */
function JsonFormatterPage() {
  return <JsonFormatterTool />;
}

/**
 * 页面标题
 */
const metadata: Metadata = {
  title: 'JSON 格式化',
};

export { metadata };

export default JsonFormatterPage;
