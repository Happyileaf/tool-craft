import type { EnvFormat } from './utils/env';

export interface FormatOption {
  value: EnvFormat;
  label: string;
  hint: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'env', label: '.env', hint: 'KEY=VALUE，# 注释' },
  { value: 'json', label: 'JSON', hint: '扁平对象，两空格缩进' },
  { value: 'yaml', label: 'YAML', hint: '扁平 key: value' },
  { value: 'export', label: 'Shell export', hint: 'export KEY=VALUE' },
];

export const DEFAULT_INPUT = `# 示例配置：左侧修改后右侧实时转换
HOST=localhost
PORT=3000
DEBUG=true
GREETING="hello world"
EMPTY=
export TOKEN=sk-demo # 行内注释会被剥离
`;
