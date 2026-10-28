'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { processLines } from './utils/id-card';
import { DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const IdCardValidator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => processLines(input), [input]);

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="输入">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="每行一个身份证号：18 位校验合法性，15 位旧证自动升位…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Tag color="blue">GB 11643-1999</Tag>
        <span className={styles.hint}>
          18 位校验行政区划码位数、出生日期与 ISO 7064 MOD 11-2 校验码；15 位在第 6 位后插入 19
          升位；仅做格式与算法校验，不内置行政区划名称表，全部计算在浏览器本地完成
        </span>
      </div>
    </div>
  );
};

export default IdCardValidator;
