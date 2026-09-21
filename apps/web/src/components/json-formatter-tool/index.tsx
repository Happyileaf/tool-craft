'use client';

import { useState, type ChangeEvent } from 'react';
import { executeCapability } from '@tool-craft/core';
import { webRegistry } from '@/lib/registry';
import { getCapabilityErrorMessage } from '@/lib/capability-error';
import CopyButton from '@/components/copy-button';
import ToolShell from '@/components/tool-shell';
import { JsonIndentEnum, JsonIndentOptions } from './constants';

/**
 * JSON 格式化工具：解析输入 JSON 文本后按所选缩进与排序选项重新序列化
 */
function JsonFormatterTool() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<JsonIndentEnum>(JsonIndentEnum.Two);
  const [isSortKeys, setIsSortKeys] = useState(false);
  const [output, setOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleFormat() {
    try {
      const outputText = (await executeCapability(webRegistry.get('data.json-format'), input, {
        indent,
        sortKeys: isSortKeys,
      })) as string;
      setOutput(outputText);
      setErrorMessage('');
    } catch (error) {
      setOutput('');
      setErrorMessage(getCapabilityErrorMessage(error));
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
  }

  function handleIndentChange(event: ChangeEvent<HTMLSelectElement>) {
    setIndent(event.target.value as JsonIndentEnum);
  }

  function handleSortKeysChange(event: ChangeEvent<HTMLInputElement>) {
    setIsSortKeys(event.target.checked);
  }

  return (
    <ToolShell
      title="JSON 格式化"
      description="格式化与美化 JSON 文本，支持缩进选择与键名字典序排序，全部在浏览器本地完成"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="json-formatter-input"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            输入 JSON
          </label>
          <textarea
            id="json-formatter-input"
            value={input}
            onChange={handleInputChange}
            rows={10}
            placeholder='粘贴需要格式化的 JSON 文本，如 {"name":"ToolCraft","local":true}'
            className="w-full rounded-md border border-gray-300 bg-white p-3 font-mono text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            <label htmlFor="json-formatter-indent" className="text-sm font-medium text-gray-700">
              缩进
            </label>
            <select
              id="json-formatter-indent"
              value={indent}
              onChange={handleIndentChange}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
            >
              {JsonIndentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isSortKeys}
              onChange={handleSortKeysChange}
              className="h-4 w-4"
            />
            按键名排序
          </label>
        </div>

        <button
          type="button"
          onClick={handleFormat}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          格式化
        </button>

        {errorMessage !== '' && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="json-formatter-output"
              className="block text-sm font-medium text-gray-700"
            >
              输出
            </label>
            <CopyButton text={output} />
          </div>
          <textarea
            id="json-formatter-output"
            value={output}
            readOnly
            rows={10}
            className="w-full rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-sm"
          />
        </div>
      </div>
    </ToolShell>
  );
}

export default JsonFormatterTool;
