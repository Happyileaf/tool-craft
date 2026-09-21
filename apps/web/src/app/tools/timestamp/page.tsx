import type { Metadata } from 'next';
import TimestampTool from '@/components/timestamp-tool';

/**
 * 时间戳转换工具页
 */
function TimestampPage() {
  return <TimestampTool />;
}

/**
 * 页面标题
 */
const metadata: Metadata = {
  title: '时间戳转换',
};

export { metadata };

export default TimestampPage;
