'use client';

import { useState, useEffect } from 'react';
import { ToolComponentProps } from '../loaders';
import { DEFAULT_SAMPLE } from './constants';
import { prefixCss } from './utils/prefixer';

import styles from './index.module.scss';

export default function CssPrefixer({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput || DEFAULT_SAMPLE);
  const [output, setOutput] = useState('');

  useEffect(() => {
    setOutput(prefixCss(input));
  }, [input]);

  return (
    <div className={styles.container}>
      <div className={styles.editorContainer}>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输入 CSS</div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴 CSS..."
          />
        </div>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输出带前缀 CSS</div>
          <textarea
            className={`${styles.textarea} ${styles.outputTextarea}`}
            value={output}
            readOnly
            placeholder="添加了浏览器前缀的 CSS 将显示在这里..."
          />
        </div>
      </div>
    </div>
  );
}
