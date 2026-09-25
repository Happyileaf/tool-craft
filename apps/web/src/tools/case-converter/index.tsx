'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Button, Radio, Space, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { convertCase, type CaseType } from './utils/convert';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

interface CaseConverterState {
  input: string;
  targetCase: CaseType;
  output: string;
}

const caseOptions = [
  { label: 'camelCase', value: 'camel' },
  { label: 'PascalCase', value: 'pascal' },
  { label: 'snake_case', value: 'snake' },
  { label: 'kebab-case', value: 'kebab' },
  { label: 'CONSTANT_CASE', value: 'constant' },
  { label: 'Title Case', value: 'title' },
  { label: 'Sentence case', value: 'sentence' },
];

const CaseConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [state, setState] = React.useState<CaseConverterState>({
    input: defaultInput || '',
    targetCase: 'camel',
    output: defaultInput ? convertCase(defaultInput, 'camel') : '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    updateOutput(input, state.targetCase);
  };

  const handleCaseChange = (e: any) => {
    const targetCase = e.target.value as CaseType;
    updateOutput(state.input, targetCase);
  };

  const updateOutput = (input: string, targetCase: CaseType) => {
    const output = convertCase(input, targetCase);
    setState({ input, targetCase, output });
  };

  const handleCopy = () => {
    if (!state.output) {
      message.warning('没有可复制的内容');
      return;
    }
    copyToClipboard(state.output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card title="输入标识符" className={styles.card}>
        <Input.TextArea
          value={state.input}
          onChange={handleInputChange}
          placeholder="在这里输入需要转换的标识符..."
          rows={6}
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
      </Card>

      <Card title="转换选项" className={styles.card}>
        <div className={styles.options}>
          <Radio.Group value={state.targetCase} onChange={handleCaseChange}>
            <Space direction="vertical">
              {caseOptions.map(option => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      </Card>

      <Card
        title="转换结果"
        className={styles.card}
        extra={
          state.output && (
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
            >
              复制结果
            </Button>
          )
        }
      >
        <Input.TextArea
          value={state.output}
          readOnly
          rows={6}
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
      </Card>
    </div>
  );
};

export default CaseConverter;
