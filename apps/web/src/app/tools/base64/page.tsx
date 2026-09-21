import type { Metadata } from 'next';
import Base64Tool from '@/components/base64-tool';

/**
 * Base64 编解码工具页
 */
function Base64Page() {
  return <Base64Tool />;
}

/**
 * 页面标题
 */
const metadata: Metadata = {
  title: 'Base64 编解码',
};

export { metadata };

export default Base64Page;
