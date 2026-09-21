'use client';

import ToolShell from '@/components/tool-shell';
import ParamsForm from './components/params-form';
import ResultPreview from './components/result-preview';
import UploadZone from './components/upload-zone';
import { useImageResize } from './hooks/use-image-resize';

/**
 * 图片缩放工具：选择本地图片后按目标尺寸、缩放策略与输出格式在浏览器内完成缩放，支持预览与下载
 */
function ImageResizeTool() {
  const {
    formState,
    handleFormChange,
    sourceUrl,
    result,
    errorMessage,
    isProcessing,
    handleFileSelect,
    handleResizeSubmit,
  } = useImageResize();

  return (
    <ToolShell
      title="图片缩放"
      description="在浏览器本地缩放图片并转换输出格式，图片不会上传到任何服务器"
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">1. 选择图片</h2>
          <UploadZone sourceUrl={sourceUrl} onFileSelect={handleFileSelect} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">2. 设置参数</h2>
          <ParamsForm formState={formState} onFormChange={handleFormChange} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">3. 执行与下载</h2>
          <button
            type="button"
            onClick={handleResizeSubmit}
            disabled={isProcessing || sourceUrl === null}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? '处理中…' : '开始缩放'}
          </button>
          {errorMessage !== '' && (
            <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {result !== null && (
            <div className="mt-4">
              <ResultPreview result={result} />
            </div>
          )}
        </section>
      </div>
    </ToolShell>
  );
}

export default ImageResizeTool;
