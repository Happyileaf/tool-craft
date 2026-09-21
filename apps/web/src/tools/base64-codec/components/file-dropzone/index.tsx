'use client';

import { useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { MAX_FILE_SIZE } from '../../constants';

/**
 * 文件转 Base64 DataURI 组件属性
 */
interface FileDropzoneProps {
  /**
   * 读取到 DataURI 后的回调
   *
   * @param dataUri - 文件对应的完整 DataURI 字符串
   */
  onDataUri: (dataUri: string) => void;
}

/**
 * 文件拖拽上传区，支持点击选择与拖拽放入，文件在浏览器本地读取为 DataURI，
 * 不会上传到任何服务器
 *
 * @param props - 组件属性
 * @returns 可交互的文件拖放区域
 */
export default function FileDropzone({ onDataUri }: FileDropzoneProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 读取本地文件并以 DataURI 形式回传，体积超限时给出错误提示
   *
   * @param file - 用户选择或拖入的文件
   */
  function readFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(t('tools.base64.fileTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onDataUri(String(reader.result));
      setFileName(file.name);
      setErrorMessage(null);
    };
    reader.onerror = () => {
      setErrorMessage(t('tools.base64.fileReadFailed'));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) readFile(file);
        }}
        className={
          isDragging
            ? 'flex items-center justify-center gap-2 rounded-lg border border-dashed border-blue-500 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700 transition-colors dark:bg-blue-950/40 dark:text-blue-300'
            : 'flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400'
        }
      >
        <FileUp className="h-4 w-4" />
        <span>{fileName ?? t('tools.base64.dragFileHere')}</span>
        {fileName ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={t('common.clear')}
            onClick={(event) => {
              event.stopPropagation();
              setFileName(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="ml-1 rounded p-0.5 text-slate-400 hover:text-rose-500"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) readFile(file);
        }}
      />
      {errorMessage ? (
        <p className="text-xs text-rose-500">{errorMessage}</p>
      ) : null}
    </div>
  );
}
