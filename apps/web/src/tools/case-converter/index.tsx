'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Radio, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { convertCase, type CaseFormat } from './utils/case-converter';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

interface CaseConverterState {
  input: string;
  output: string;
  format: CaseFormat;
}

const CaseConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [state, setState] = React.useState<CaseConverterState>({
    input: defaultInput || '',
    output: '',
    format: 'camel',
  });

  const updateOutput = (newInput: string, newFormat: CaseFormat) => {
    const output = convertCase(newInput, newFormat);
    setState(prev => ({
      ...prev,
      input: newInput,
      format: newFormat,
      output,
    }));
  };

  const handleCopy = () => {
    if (!state.output) {
      message.warning('没有可复制的结果');
      return;
    }
    copyToClipboard(state.output);
    message.success('复制成功');
  };

  const defaultSampleInput = `hello_world
my-variable-name
getUserById`;

  return (
    <div className={styles.container}>
      <Card
        title="输入需要转换的文本"
        className={styles.card}
        extra={
          <Button
            type="text"
            onClick={() => updateOutput(defaultSampleInput, state.format)}
          >
            使用示例
          </Button>
        }
      >
        <Input.TextArea
          value={state.input}
          onChange={(e) => updateOutput(e.target.value, state.format)}
          placeholder="在这里输入需要转换格式的标识符..."
          rows={8}
          autoSize={{ minRows: 6, maxRows: 16 }}
        />

        <div className={styles.formatSelector}>
          <div className={styles.label}>目标格式：</div>
          <Radio.Group
            value={state.format}
            onChange={(e) => updateOutput(state.input, e.target.value)}
          >
            <Radio.Button value="camel">camelCase</Radio.Button>
            <Radio.Button value="snake">snake_case</Radio.Button>
            <Radio.Button value="kebab">kebab-case</Radio.Button>
            <Radio.Button value="pascal">PascalCase</Radio.Button>
            <Radio.Button value="upper">UPPER_CASE</Radio.Button>
            <Radio.Button value="lower">lower_case</Radio.Button>
          </Radio.Group>
        </div>
      </Card>

      <Card
        title="转换结果"
        className={styles.card}
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
          >
            复制结果
          </Button>
        }
      >
        <Input.TextArea
          value={state.output}
          readOnly
          placeholder="转换结果会在这里显示..."
          rows={8}
          autoSize={{ minRows: 6, maxRows: 16 }}
        />
      </Card>
    </div>
  );
};

export default CaseConverter;
