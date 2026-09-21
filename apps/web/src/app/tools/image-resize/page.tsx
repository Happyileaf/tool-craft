import type { Metadata } from 'next';
import ImageResizeTool from '@/components/image-resize-tool';

/**
 * 图片缩放工具页
 */
function ImageResizePage() {
  return <ImageResizeTool />;
}

/**
 * 页面标题
 */
const metadata: Metadata = {
  title: '图片缩放',
};

export { metadata };

export default ImageResizePage;
