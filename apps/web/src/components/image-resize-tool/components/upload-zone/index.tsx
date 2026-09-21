'use client';

import { useState, type ChangeEvent, type DragEvent } from 'react';

/** 图片上传区属性 */
type UploadZoneProps = {
  /** 原图预览地址，未选择文件时为 null */
  sourceUrl: string | null;
  /** 文件选择回调，点击选择与拖放均触发 */
  onFileSelect: (file: File) => void;
};

/**
 * 图片上传区：点击或拖放选择图片文件，并展示原图预览
 */
function UploadZone({ sourceUrl, onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    /** 清空选择值，保证再次选择同一文件时仍能触发 onChange */
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  }

  return (
    <div>
      <label
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-blue-400'
        }`}
      >
        <input type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
        <span className="text-sm font-medium text-gray-700">点击选择图片，或将图片拖放到此处</span>
        <span className="mt-1 text-xs text-gray-400">
          支持 PNG / JPEG / WebP 等浏览器可解码格式，文件不会离开本机
        </span>
      </label>
      {sourceUrl !== null && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-gray-700">原图预览</p>
          <img
            src={sourceUrl}
            alt="原图预览"
            className="max-h-64 rounded-md border border-gray-200 bg-white"
          />
        </div>
      )}
    </div>
  );
}

export default UploadZone;
