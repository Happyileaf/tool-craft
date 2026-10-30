'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { encodeWord, processLines } from './utils/soundex';
import { CODE_GROUPS, DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const SoundexCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const batch = React.useMemo(() => processLines(input), [input]);
  const detail = React.useMemo(() => {
    const firstToken = input
      .split('\n')
      .flatMap((line) => line.trim().split(/\s+/))
      .find((token) => token !== '');
    return firstToken ? encodeWord(firstToken) : null;
  }, [input]);

  const handleCopy = () => {
    if (batch.output.trim() === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(batch.output);
    message.success('已复制编码结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="输入（英文单词，每行一个或空格分隔）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="例如：Robert Rupert Ashcraft Tymczak…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出（American Soundex 4 位编码）"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={batch.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {batch.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {batch.warnings.map((warning, index) => (
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

      {detail && detail.valid ? (
        <Card size="small" title={`逐字符推导（首个单词：${detail.word} → ${detail.code}）`}>
          <div className={styles.steps}>
            {detail.steps.map((step) => (
              <div key={`${step.index}-${step.char}`} className={styles.stepRow}>
                <span className={styles.stepIndex}>
                  {step.char === '—' ? '结果' : `#${step.index} ${step.char}`}
                </span>
                <span className={styles.stepReason}>{step.reason}</span>
                <span className={styles.stepCode}>{step.codeAfter}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {batch.groups.length > 0 ? (
        <Card size="small" title="同音分组（编码相同的单词读音相近）">
          <div className={styles.groups}>
            {batch.groups.map((group) => (
              <div key={group.code} className={styles.groupItem}>
                <Tag color={group.words.length > 1 ? 'green' : 'default'}>{group.code}</Tag>
                <span className={styles.groupWords}>{group.words.join('、')}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className={styles.toolbar}>
        <Space size={[8, 8]} wrap>
          {CODE_GROUPS.map((group) => (
            <Tag key={group.digit}>
              {group.digit}：{group.letters}
            </Tag>
          ))}
        </Space>
        <span className={styles.hint}>
          经典 US Census / NARA 规则：首字母保留，相邻同音辅音只编码一次，元音（含 Y）分隔后重新计数，H/W
          不隔断同音合并，不足补 0、超出截断；纯浏览器本地运算
        </span>
      </div>
    </div>
  );
};

export default SoundexCodec;
