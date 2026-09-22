'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Statistic } from 'antd';
import { CountResult, countWords } from './utils/count';
import styles from './index.module.css';

const WordCount: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState(defaultInput || '');
  const [result, setResult] = React.useState<CountResult>({
    characters: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
  });

  React.useEffect(() => {
    setResult(countWords(text));
  }, [text]);

  return (
    <div className={styles.container}>
      <Card title="输入文本" className={styles.inputCard}>
        <Input.TextArea
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          placeholder="在这里输入需要统计的文本..."
          rows={12}
          autoSize={{ minRows: 8, maxRows: 20 }}
        />
      </Card>

      <div className={styles.statsGrid}>
        <Card>
          <Statistic title="字符数（含空格）" value={result.characters} />
        </Card>
        <Card>
          <Statistic title="字数" value={result.words} />
        </Card>
        <Card>
          <Statistic title="行数" value={result.lines} />
        </Card>
        <Card>
          <Statistic title="段落数" value={result.paragraphs} />
        </Card>
      </div>
    </div>
  );
};

export default WordCount;
