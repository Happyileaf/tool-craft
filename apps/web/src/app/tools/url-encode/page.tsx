import type { Metadata } from 'next';
import UrlEncodeTool from '@/components/url-encode-tool';

/**
 * URL 编码工具页
 */
function UrlEncodePage() {
  return <UrlEncodeTool />;
}

/**
 * 页面标题
 */
const metadata: Metadata = {
  title: 'URL 编码',
};

export { metadata };

export default UrlEncodePage;
