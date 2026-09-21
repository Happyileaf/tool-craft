import { ImageFormatLabelMap } from '../../constants';
import type { ImageResizeResult } from '../../types';

/** 结果预览属性 */
type ResultPreviewProps = {
  /** 缩放结果 */
  result: ImageResizeResult;
};

/**
 * 缩放结果预览：展示结果图片、新尺寸与输出格式信息，并提供带新尺寸命名的下载入口
 */
function ResultPreview({ result }: ResultPreviewProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <img
        src={result.url}
        alt="缩放结果预览"
        className="max-h-64 rounded-md border border-gray-200"
      />
      <p className="mt-2 text-sm text-gray-500">
        新尺寸：{result.width} × {result.height}（{ImageFormatLabelMap[result.format]}）
      </p>
      <a
        href={result.url}
        download={result.filename}
        className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        下载 {result.filename}
      </a>
    </div>
  );
}

export default ResultPreview;
