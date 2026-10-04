import { useState } from 'react';
import { ToolComponentProps } from '../types';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { copyToClipboard } from '../../../lib/copy';
import { RefreshCw, Copy } from 'lucide-react';
import { generatePassword } from './utils/generate';
import { DEFAULT_LENGTH } from './constants';

export default function StrongPasswordGenerator({ defaultSampleInput }: ToolComponentProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const handleGenerate = () => {
    const newPassword = generatePassword({
      length,
      includeLowercase,
      includeUppercase,
      includeDigits,
      includeSymbols,
    });
    setPassword(newPassword);
  };

  const handleCopy = async () => {
    if (password) {
      await copyToClipboard(password);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">生成的密码</Label>
        <Input
          id="password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="点击生成按钮创建密码"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>密码长度: {length}</Label>
        </div>
        <Slider
          defaultValue={[length]}
          min={4}
          max={64}
          step={1}
          onValueChange={(value) => setLength(value[0])}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="lowercase"
            checked={includeLowercase}
            onCheckedChange={setIncludeLowercase}
          />
          <Label htmlFor="lowercase">包含小写字母</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="uppercase"
            checked={includeUppercase}
            onCheckedChange={setIncludeUppercase}
          />
          <Label htmlFor="uppercase">包含大写字母</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="digits"
            checked={includeDigits}
            onCheckedChange={setIncludeDigits}
          />
          <Label htmlFor="digits">包含数字</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="symbols"
            checked={includeSymbols}
            onCheckedChange={setIncludeSymbols}
          />
          <Label htmlFor="symbols">包含特殊符号</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          重新生成
        </Button>
        <Button onClick={handleCopy} disabled={!password}>
          <Copy className="mr-2 h-4 w-4" />
          复制
        </Button>
      </div>
    </div>
  );
}
