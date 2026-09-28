import { useState, useMemo } from 'react';
import { ToolComponentProps } from '@/tools/types';
import { DualTextEditor } from '@/components/DualTextEditor';
import { CATEGORY } from './constants';
import { csvToJson, jsonToCsv } from './utils/converter';

export default function CsvJsonConverter({ className }: ToolComponentProps) {
  const [input, setInput] = useState(`name,age,city
Alice,30,New York
Bob,25,London`);
  const [direction, setDirection] = useState<'csvToJson' | 'jsonToCsv'>('csvToJson');

  const output = useMemo(() => {
    try {
      if (direction === 'csvToJson') {
        const json = csvToJson(input);
        return JSON.stringify(json, null, 2);
      } else {
        let parsedJson;
        try {
          parsedJson = JSON.parse(input);
        } catch (e) {
          return 'JSON 解析错误：请输入有效的 JSON 数组';
        }
        if (!Array.isArray(parsedJson)) {
          return '错误：JSON 必须是一个数组';
        }
        return jsonToCsv(parsedJson);
      }
    } catch (e) {
      return `转换错误：${(e as Error).message}`;
    }
  }, [input, direction]);

  return (
    <div className={className}>
      <DualTextEditor
        input={input}
        onInputChange={setInput}
        output={output}
        leftLabel={direction === 'csvToJson' ? 'CSV 输入' : 'JSON 输入'}
        rightLabel={direction === 'csvToJson' ? 'JSON 输出' : 'CSV 输出'}
        showSwap
        onSwap={() => {
          setInput(output);
          setDirection(direction === 'csvToJson' ? 'jsonToCsv' : 'csvToJson');
        }}
      />
    </div>
  );
}
