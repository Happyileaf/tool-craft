import { useState } from 'react';
import { ToolComponentProps } from '../types';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { crc32 } from './utils/crc32';
import { Copy } from 'lucide-react';
import { copyToClipboard } from '../../../lib/copy';

export default function Crc32Checksum({ defaultSampleInput }: ToolComponentProps) {
  const [text, setText] = useState(defaultSampleInput || '');
  const [result, setResult] = useState('');

  const calculate = () => {
    setResult(crc32(text));
  };

  const handleCopy = () => {
    if (result) {
      copyToClipboard(result);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <label htmlFor="text" className="text-sm font-medium">输入文本</label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入需要计算CRC32校验和的文本"
          className="min-h-[150px]"
        />
      </div>

      <Button onClick={calculate}>计算 CRC32</Button>

      {result && (
        <div className="flex flex-col gap-2">
          <label htmlFor="result" className="text-sm font-medium">CRC32 结果</label>
          <div className="flex gap-2">
            <Input
              id="result"
              type="text"
              value={result}
              readOnly
              className="font-mono"
            />
            <Button onClick={handleCopy} className="shrink-0">
              <Copy size={18} className="mr-2" />
              复制
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
