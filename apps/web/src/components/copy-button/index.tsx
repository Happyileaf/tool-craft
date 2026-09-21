'use client';

import { useState } from 'react';

/** 复制按钮属性 */
type CopyButtonProps = {
  /** 待复制文本，为空字符串时禁用按钮 */
  text: string;
};

/**
 * 复制按钮：将文本写入剪贴板，成功后短暂展示「已复制」反馈
 */
function CopyButton({ text }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    if (text === '') {
      return;
    }
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={text === ''}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isCopied ? '已复制' : '复制'}
    </button>
  );
}

export default CopyButton;
