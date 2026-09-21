'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import JsonInput from './components/json-input';
import JsonOutput from './components/json-output';
import { formatJson } from './utils/format-json';

/**
 * JSON Formatter 工具页，左侧采集输入并提供操作入口，右侧展示格式化结果，
 * 全部计算均在浏览器主线程本地完成，不发送任何网络请求
 *
 * @returns JSON 格式化工具交互界面
 */
function JsonFormatter() {
  const [input, setInput] = useState('');
  const [hasFormatted, setHasFormatted] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 执行格式化：结果只写入结果区状态，输入内容始终保留，非法时可直接修正后重试
   */
  function handleFormat() {
    const result = formatJson(input);
    setHasFormatted(true);
    if (result.success) {
      setOutput(result.output ?? null);
      setErrorMessage(null);
    } else {
      setOutput(null);
      setErrorMessage(result.errorMessage ?? null);
    }
  }

  /**
   * 清空输入与全部结果状态，使界面回到初始引导态
   */
  function handleClear() {
    setInput('');
    setHasFormatted(false);
    setOutput(null);
    setErrorMessage(null);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <JsonInput value={input} onChange={setInput} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleFormat}>
              格式化
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              disabled={input.length === 0 && !hasFormatted}
            >
              清空
            </Button>
          </div>
        </div>

        <JsonOutput
          hasFormatted={hasFormatted}
          output={output}
          errorMessage={errorMessage}
        />
      </div>
    </section>
  );
}

export default JsonFormatter;
