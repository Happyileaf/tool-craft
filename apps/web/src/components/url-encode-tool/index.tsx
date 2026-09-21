'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { executeCapability } from '@tool-craft/core';
import { webRegistry } from '@/lib/registry';
import { getCapabilityErrorMessage } from '@/lib/capability-error';
import CopyButton from '@/components/copy-button';
import ToolShell from '@/components/tool-shell';
import { UrlEncodeScopeEnum, UrlEncodeScopeOptions } from './constants';

/**
 * URL 编码工具：按所选范围对文本做百分号编码，输入变化时即时在本地完成转换
 */
function UrlEncodeTool() {
  const [input, setInput] = useState('');
  const [scope, setScope] = useState<UrlEncodeScopeEnum>(UrlEncodeScopeEnum.Component);
  const [output, setOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    /** 取消标记：输入再次变化时丢弃上一次异步结果，避免旧结果覆盖新结果 */
    let isCancelled = false;
    const convert = async () => {
      try {
        const outputText = (await executeCapability(webRegistry.get('text.url-encode'), input, {
          scope,
        })) as string;
        if (!isCancelled) {
          setOutput(outputText);
          setErrorMessage('');
        }
      } catch (error) {
        if (!isCancelled) {
          setOutput('');
          setErrorMessage(getCapabilityErrorMessage(error));
        }
      }
    };
    void convert();
    return () => {
      isCancelled = true;
    };
  }, [input, scope]);

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
  }

  function handleScopeChange(event: ChangeEvent<HTMLSelectElement>) {
    setScope(event.target.value as UrlEncodeScopeEnum);
  }

  return (
    <ToolShell
      title="URL 编码"
      description="对文本进行百分号编码，支持组件级与 URI 级两种范围，输入后即时转换"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label htmlFor="url-encode-scope" className="text-sm font-medium text-gray-700">
            编码范围
          </label>
          <select
            id="url-encode-scope"
            value={scope}
            onChange={handleScopeChange}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            {UrlEncodeScopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="url-encode-input"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            输入
          </label>
          <textarea
            id="url-encode-input"
            value={input}
            onChange={handleInputChange}
            rows={5}
            placeholder="输入要编码的文本，如 https://example.com/search?q=在线工具"
            className="w-full rounded-md border border-gray-300 bg-white p-3 font-mono text-sm"
          />
        </div>

        {errorMessage !== '' && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="url-encode-output" className="block text-sm font-medium text-gray-700">
              输出
            </label>
            <CopyButton text={output} />
          </div>
          <textarea
            id="url-encode-output"
            value={output}
            readOnly
            rows={5}
            className="w-full rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-sm"
          />
        </div>
      </div>
    </ToolShell>
  );
}

export default UrlEncodeTool;
