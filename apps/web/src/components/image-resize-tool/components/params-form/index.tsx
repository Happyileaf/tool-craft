'use client';

import type { ChangeEvent } from 'react';
import {
  ImageFitEnum,
  ImageFitOptions,
  ImageFormatEnum,
  ImageFormatOptions,
} from '../../constants';
import type { ImageResizeFormState } from '../../types';

/** 参数表单属性 */
type ParamsFormProps = {
  /** 表单当前状态 */
  formState: ImageResizeFormState;
  /** 表单局部更新回调 */
  onFormChange: (patch: Partial<ImageResizeFormState>) => void;
};

/**
 * 图片缩放参数表单：目标尺寸、缩放策略、输出格式与压缩质量的受控表单
 */
function ParamsForm({ formState, onFormChange }: ParamsFormProps) {
  function handleWidthChange(event: ChangeEvent<HTMLInputElement>) {
    onFormChange({ width: event.target.value });
  }

  function handleHeightChange(event: ChangeEvent<HTMLInputElement>) {
    onFormChange({ height: event.target.value });
  }

  function handleFitChange(event: ChangeEvent<HTMLSelectElement>) {
    onFormChange({ fit: event.target.value as ImageFitEnum });
  }

  function handleFormatChange(event: ChangeEvent<HTMLSelectElement>) {
    onFormChange({ format: event.target.value as ImageFormatEnum });
  }

  function handleQualityChange(event: ChangeEvent<HTMLInputElement>) {
    onFormChange({ quality: event.target.value });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="resize-width" className="mb-1 block text-sm font-medium text-gray-700">
            宽度（像素）
          </label>
          <input
            id="resize-width"
            type="number"
            min={1}
            value={formState.width}
            onChange={handleWidthChange}
            placeholder="选填"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="resize-height" className="mb-1 block text-sm font-medium text-gray-700">
            高度（像素）
          </label>
          <input
            id="resize-height"
            type="number"
            min={1}
            value={formState.height}
            onChange={handleHeightChange}
            placeholder="选填"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="resize-fit" className="mb-1 block text-sm font-medium text-gray-700">
            缩放策略
          </label>
          <select
            id="resize-fit"
            value={formState.fit}
            onChange={handleFitChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {ImageFitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="resize-format" className="mb-1 block text-sm font-medium text-gray-700">
            输出格式
          </label>
          <select
            id="resize-format"
            value={formState.format}
            onChange={handleFormatChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {ImageFormatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="resize-quality" className="mb-1 block text-sm font-medium text-gray-700">
            质量（1-100）
          </label>
          <input
            id="resize-quality"
            type="number"
            min={1}
            max={100}
            value={formState.quality}
            onChange={handleQualityChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        宽高至少填写一项：仅填单边时，另一边按原图宽高比自动推算
      </p>
    </div>
  );
}

export default ParamsForm;
