'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { executeCapability } from '@tool-craft/core';
import { webRegistry } from '@/lib/registry';
import { getCapabilityErrorMessage } from '@/lib/capability-error';
import CopyButton from '@/components/copy-button';
import ToolShell from '@/components/tool-shell';
import {
  TimestampDirectionEnum,
  TimestampDirectionOptions,
  TimestampUnitEnum,
  TimestampUnitOptions,
} from './constants';

/**
 * 时间戳转换工具：在日期时间文本与秒/毫秒时间戳之间双向转换，输入变化时即时完成
 */
function TimestampTool() {
  const [direction, setDirection] = useState<TimestampDirectionEnum>(
    TimestampDirectionEnum.ToDateTime,
  );
  const [unit, setUnit] = useState<TimestampUnitEnum>(TimestampUnitEnum.Seconds);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    /** 空输入直接清空结果，避免页面初始即出现错误提示 */
    if (input.trim() === '') {
      setOutput('');
      setErrorMessage('');
      return;
    }
    /** 取消标记：输入再次变化时丢弃上一次异步结果，避免旧结果覆盖新结果 */
    let isCancelled = false;
    const convert = async () => {
      try {
        const outputText = (await executeCapability(
          webRegistry.get('time.timestamp-convert'),
          input,
          { direction, unit },
        )) as string;
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
  }, [input, direction, unit]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value);
  }

  function handleDirectionChange(event: ChangeEvent<HTMLSelectElement>) {
    setDirection(event.target.value as TimestampDirectionEnum);
  }

  function handleUnitChange(event: ChangeEvent<HTMLSelectElement>) {
    setUnit(event.target.value as TimestampUnitEnum);
  }

  return (
    <ToolShell
      title="时间戳转换"
      description="在日期时间文本与秒/毫秒时间戳之间双向转换；不带时区的输入按 UTC 解析，输出为 UTC ISO 8601"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            <label htmlFor="timestamp-direction" className="text-sm font-medium text-gray-700">
              转换方向
            </label>
            <select
              id="timestamp-direction"
              value={direction}
              onChange={handleDirectionChange}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
            >
              {TimestampDirectionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="timestamp-unit" className="text-sm font-medium text-gray-700">
              单位
            </label>
            <select
              id="timestamp-unit"
              value={unit}
              onChange={handleUnitChange}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
            >
              {TimestampUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="timestamp-input" className="mb-1 block text-sm font-medium text-gray-700">
            输入
          </label>
          <input
            id="timestamp-input"
            value={input}
            onChange={handleInputChange}
            placeholder={
              direction === TimestampDirectionEnum.ToDateTime
                ? '输入时间戳，如 1790000000'
                : '输入日期时间，如 2026-09-21 12:00:00'
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm"
          />
        </div>

        {errorMessage !== '' && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="timestamp-output" className="block text-sm font-medium text-gray-700">
              输出
            </label>
            <CopyButton text={output} />
          </div>
          <input
            id="timestamp-output"
            value={output}
            readOnly
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
          />
        </div>
      </div>
    </ToolShell>
  );
}

export default TimestampTool;
