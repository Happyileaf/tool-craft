'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Button, message, Slider } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { generateLoremIpsum } from './utils/generate';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

interface LoremIpsumState {
  paragraphs: number;
  output: string;
}

const LoremIpsum: React.FC<ToolComponentProps> = () => {
  const [state, setState] = React.useState<LoremIpsumState>({
    paragraphs: 3,
    output: generateLoremIpsum(3),
  });

  const handleRegenerate = () => {
    const output = generateLoremIpsum(state.paragraphs);
    setState({ ...state, output });
  };

  const handleParagraphsChange = (value: number) => {
    const output = generateLoremIpsum(value);
    setState({ paragraphs: value, output });
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
      <Card title="生成选项" className={styles.card}>
        <div className={styles.controls}>
          <div className={styles.control-item}>
            <span>段落数：</span>
            <Slider
              min={1}
              max={20}
              value={state.paragraphs}
              onChange={handleParagraphsChange}
              style={{ width: 200 }}
            />
            <span>{state.paragraphs}</span>
          </div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRegenerate}
          >
            重新生成
          </Button>
        </div>
      </Card>

      <Card
        title="Lorem Ipsum 结果"
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
          rows={15}
          autoSize={{ minRows: 8, maxRows: 30 }}
        />
      </Card>
    </div>
  );
};

export default LoremIpsum;
