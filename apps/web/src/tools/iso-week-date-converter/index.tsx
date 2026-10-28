'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { processLines } from './utils/iso-week';
import { DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const IsoWeekDateConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => processLines(input), [input]);

  const handleCopy = () => {
    if (result.output.trim() === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="输入（每行一个日期，双向自动识别）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={'公历 YYYY-MM-DD（如 2026-10-29）\n或 ISO 周边历 YYYY-Www-D（如 2026-W44-4）'}
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
        <Tag color="blue">ISO 8601</Tag>
        <span className={styles.hint}>
          周一为周首，含 1 月 4 日的周为第 1 周；ISO 年长年含 53 周（如 2020、2026），平年含 52
          周；年初年末日期可能归属相邻 ISO 年，输出会给出跨年提示；全部计算在浏览器本地完成
        </span>
      </div>
    </div>
  );
};

export default IsoWeekDateConverter;
