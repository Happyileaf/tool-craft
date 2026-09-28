import { useState, useMemo } from 'react';
import { ToolComponentProps } from '@/tools/types';
import { CATEGORY } from './constants';
import { getCommonPatterns, generateRegexByName } from './utils/generator';
import { DualTextEditor } from '@/components/DualTextEditor';

export default function RegexGenerator({ className }: ToolComponentProps) {
  const [selectedPattern, setSelectedPattern] = useState('email');
  const result = useMemo(() => {
    const generated = generateRegexByName(selectedPattern);
    if (!generated) {
      return '';
    }
    return `/${generated.pattern}/${generated.flags}

${generated.description}`;
  }, [selectedPattern]);

  const patterns = getCommonPatterns();

  return (
    <div className={className}>
      <div className="mb-4">
        <label className="block mb-2 font-medium">选择常用正则类型：</label>
        <select
          className="w-full p-2 border rounded bg-white dark:bg-gray-800"
          value={selectedPattern}
          onChange={(e) => setSelectedPattern(e.target.value)}
        >
          {patterns.map(pattern => (
            <option key={pattern} value={pattern}>{pattern}</option>
          ))}
        </select>
      </div>
      <DualTextEditor
        input=""
        output={result}
        disabledInput
        leftLabel="选择类型"
        rightLabel="生成结果"
      />
    </div>
  );
}
