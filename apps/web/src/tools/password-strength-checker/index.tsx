import { useState } from 'react';
import { ToolComponentProps } from '../types';
import { Input } from '../../../components/ui/input';
import { checkPasswordStrength, PasswordStrengthResult } from './utils/check';
import { Eye, EyeOff } from 'lucide-react';

const levelText = {
  weak: {
    text: '弱',
    color: 'text-red-500',
    bg: 'bg-red-500',
  },
  medium: {
    text: '中',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500',
  },
  strong: {
    text: '强',
    color: 'text-green-500',
    bg: 'bg-green-500',
  },
};

export default function PasswordStrengthChecker({ defaultSampleInput }: ToolComponentProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const result = checkPasswordStrength(password);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">输入密码</label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入要检测的密码"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">强度评分</span>
          <span className={`text-sm font-bold ${levelText[result.level].color}`}>
            {levelText[result.level].text} ({result.score}/6)
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${levelText[result.level].bg} transition-all duration-300`}
            style={{ width: `${(result.score / 6) * 100}%` }}
          />
        </div>
      </div>

      {result.suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">改进建议</span>
          <ul className="text-sm space-y-1">
            {result.suggestions.map((suggestion, index) => (
              <li key={index} className="text-gray-600">• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
