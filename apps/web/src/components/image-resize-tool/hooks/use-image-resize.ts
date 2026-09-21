import { useCallback, useEffect, useRef, useState } from 'react';
import { executeCapability } from '@tool-craft/core';
import { webRegistry } from '@/lib/registry';
import { getCapabilityErrorMessage } from '@/lib/capability-error';
import {
  DEFAULT_IMAGE_QUALITY,
  IMAGE_FORMAT_EXTENSION_MAP,
  ImageFitEnum,
  ImageFormatEnum,
  MAX_IMAGE_QUALITY,
} from '../constants';
import type { ImageResizeFormState, ImageResizeRequestParams, ImageResizeResult } from '../types';

/**
 * 释放 object URL，传入 null 时静默跳过
 *
 * @param url - 待释放的 object URL
 */
function revokeObjectUrl(url: string | null): void {
  if (url !== null) {
    URL.revokeObjectURL(url);
  }
}

/**
 * 将表单中的数字文本解析为正整数
 *
 * @param text - 数字输入文本
 * @param label - 字段中文名，用于拼装错误提示
 * @returns 空文本返回 undefined，合法输入返回对应正整数
 * @throws 当输入非空但不是正整数时抛出带用户可读信息的 Error
 */
function parsePositiveInteger(text: string, label: string): number | undefined {
  const trimmedText = text.trim();
  if (trimmedText === '') {
    return undefined;
  }
  const value = Number(trimmedText);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label}需为正整数`);
  }
  return value;
}

/**
 * 将参数表单状态解析为能力请求参数
 *
 * @param formState - 参数表单状态
 * @returns 与 image.resize 契约对齐的请求参数
 * @throws 当尺寸或质量非法、或宽高均未填写时抛出带用户可读信息的 Error
 */
function buildRequestParams(formState: ImageResizeFormState): ImageResizeRequestParams {
  const width = parsePositiveInteger(formState.width, '宽度');
  const height = parsePositiveInteger(formState.height, '高度');
  const quality = parsePositiveInteger(formState.quality, '质量');
  if (width === undefined && height === undefined) {
    throw new Error('宽度与高度至少填写一项');
  }
  if (quality !== undefined && quality > MAX_IMAGE_QUALITY) {
    throw new Error(`质量需为 1-${MAX_IMAGE_QUALITY}`);
  }
  return {
    width,
    height,
    fit: formState.fit,
    format: formState.format,
    quality: quality ?? DEFAULT_IMAGE_QUALITY,
  };
}

/**
 * useImageResize 返回的工具状态与操作集合
 */
type UseImageResizeResult = {
  /** 参数表单状态 */
  formState: ImageResizeFormState;
  /** 参数表单局部更新 */
  handleFormChange: (patch: Partial<ImageResizeFormState>) => void;
  /** 原图预览地址，未选择文件时为 null */
  sourceUrl: string | null;
  /** 缩放结果，未执行或执行失败时为 null */
  result: ImageResizeResult | null;
  /** 错误提示文案，无错误时为空字符串 */
  errorMessage: string;
  /** 是否正在执行缩放 */
  isProcessing: boolean;
  /** 选择或替换图片文件 */
  handleFileSelect: (file: File) => void;
  /** 提交参数表单并执行缩放 */
  handleResizeSubmit: () => void;
};

/**
 * 图片缩放工具的核心 Hook：管理参数表单、原图字节与预览、缩放执行与结果
 *
 * 所有计算经 executeCapability 在浏览器本地完成；
 * 产生的 object URL 在替换与组件卸载时统一释放，避免内存泄漏
 *
 * @returns 工具状态与操作集合
 */
function useImageResize(): UseImageResizeResult {
  const [formState, setFormState] = useState<ImageResizeFormState>({
    /** 初始值与 image.resize 契约的默认参数保持一致 */
    width: '',
    height: '',
    fit: ImageFitEnum.Cover,
    format: ImageFormatEnum.Png,
    quality: String(DEFAULT_IMAGE_QUALITY),
  });
  const [sourceBytes, setSourceBytes] = useState<Uint8Array | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResizeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /** 当前持有的 object URL 引用，用于在替换与卸载时释放 */
  const sourceUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => {
    /** 组件卸载时释放仍在持有的 object URL */
    return () => {
      revokeObjectUrl(sourceUrlRef.current);
      revokeObjectUrl(resultUrlRef.current);
    };
  }, []);

  const handleFormChange = useCallback((patch: Partial<ImageResizeFormState>) => {
    setFormState((previous) => ({ ...previous, ...patch }));
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择图片文件');
      return;
    }
    const selectFile = async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const nextSourceUrl = URL.createObjectURL(file);
        revokeObjectUrl(sourceUrlRef.current);
        revokeObjectUrl(resultUrlRef.current);
        sourceUrlRef.current = nextSourceUrl;
        resultUrlRef.current = null;
        setSourceBytes(bytes);
        setSourceUrl(nextSourceUrl);
        setResult(null);
        setErrorMessage('');
      } catch {
        setErrorMessage('读取文件失败，请重新选择图片');
      }
    };
    void selectFile();
  }, []);

  const handleResizeSubmit = useCallback(() => {
    const submitResize = async () => {
      if (sourceBytes === null) {
        setErrorMessage('请先选择图片');
        return;
      }
      /** 表单解析出的请求参数；解析失败时以用户可读错误中断提交 */
      let requestParams: ImageResizeRequestParams;
      try {
        requestParams = buildRequestParams(formState);
      } catch (error) {
        setResult(null);
        setErrorMessage(error instanceof Error ? error.message : '参数不合法');
        return;
      }
      setIsProcessing(true);
      try {
        const outputBytes = (await executeCapability(
          webRegistry.get('image.resize'),
          sourceBytes,
          requestParams,
        )) as Uint8Array;
        /** slice() 复制出 ArrayBuffer 背书的副本，以满足 Blob 构造的 BlobPart 类型约束 */
        const resultBlob = new Blob([outputBytes.slice()], {
          type: `image/${requestParams.format}`,
        });
        /** 解码结果图片以实测新尺寸，供预览信息与下载文件名使用 */
        const bitmap = await createImageBitmap(resultBlob);
        const nextResultUrl = URL.createObjectURL(resultBlob);
        revokeObjectUrl(resultUrlRef.current);
        resultUrlRef.current = nextResultUrl;
        setResult({
          url: nextResultUrl,
          width: bitmap.width,
          height: bitmap.height,
          format: requestParams.format,
          filename: `resized-${bitmap.width}x${bitmap.height}.${
            IMAGE_FORMAT_EXTENSION_MAP[requestParams.format]
          }`,
        });
        bitmap.close();
        setErrorMessage('');
      } catch (error) {
        setResult(null);
        setErrorMessage(getCapabilityErrorMessage(error));
      } finally {
        setIsProcessing(false);
      }
    };
    void submitResize();
  }, [formState, sourceBytes]);

  return {
    formState,
    handleFormChange,
    sourceUrl,
    result,
    errorMessage,
    isProcessing,
    handleFileSelect,
    handleResizeSubmit,
  };
}

export { useImageResize };
