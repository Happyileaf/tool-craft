'use client';

import { useState, type ChangeEvent } from 'react';
import { executeCapability } from '@tool-craft/core';
import { webRegistry } from '@/lib/registry';
import { getCapabilityErrorMessage } from '@/lib/capability-error';
import CopyButton from '@/components/copy-button';
import ToolShell from '@/components/tool-shell';
import { BASE64_MODE_CAPABILITY_ID_MAP, Base64ModeEnum, Base64ModeOptions } from './constants';

/**
 * Base64 编解码工具：在同一页面切换编码/解码模式，对文本与 Base64 字符串双向转换
 */
function Base64Tool() {
  const [mode, setMode] = useState<Base64ModeEnum>(Base64ModeEnum.Encode);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleConvert() {
    try {
      const outputText = (await executeCapability(
        webRegistry.get(BASE64_MODE_CAPABILITY_ID_MAP[mode]),
        input,
        {},
      )) as string;
      setOutput(outputText);
      setErrorMessage('');
    } catch (error) {
      setOutput('');
      setErrorMessage(getCapabilityErrorMessage(error));
    }
  }

  function handleModeChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextMode = event.target.value as Base64ModeEnum;
    setMode(nextMode);
    setErrorMessage('');
    /** 已有转换结果时将结果换到输入区，便于直接进行反向转换 */
    if (output !== '') {
      setInput(output);
      setOutput('');
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
  }

  return (
    <ToolShell
      title="Base64 编解码"
      description="文本与 Base64 字符串双向互转，中文与 emoji 按 UTF-8 安全处理，全部在浏览器本地完成"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label htmlFor="base64-mode" className="text-sm font-medium text-gray-700">
            模式
          </label>
          <select
            id="base64-mode"
            value={mode}
            onChange={handleModeChange}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            {Base64ModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="base64-input" className="mb-1 block text-sm font-medium text-gray-700">
            输入
          </label>
          <textarea
            id="base64-input"
            value={input}
            onChange={handleInputChange}
            rows={6}
            placeholder={
              mode === Base64ModeEnum.Encode ? '输入要编码的文本' : '输入要解码的 Base64 字符串'
            }
            className="w-full rounded-md border border-gray-300 bg-white p-3 font-mono text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleConvert}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {mode === Base64ModeEnum.Encode ? '编码' : '解码'}
        </button>

        {errorMessage !== '' && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="base64-output" className="block text-sm font-medium text-gray-700">
              输出
            </label>
            <CopyButton text={output} />
          </div>
          <textarea
            id="base64-output"
            value={output}
            readOnly
            rows={6}
            className="w-full rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-sm"
          />
        </div>
      </div>
    </ToolShell>
  );
}

export default Base64Tool;
