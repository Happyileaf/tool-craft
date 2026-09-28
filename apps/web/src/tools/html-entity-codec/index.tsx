'use client';

import { useState, useEffect } from 'react';
import { ToolComponentProps } from '../loaders';
import { DEFAULT_SAMPLE } from './constants';
import { decodeHtmlEntities, encodeHtmlEntities } from './utils/codec';

import styles from './index.module.scss';

type Mode = 'encode' | 'decode';

export default function HtmlEntityCodec({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput || DEFAULT_SAMPLE);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('decode');

  useEffect(() => {
    if (mode === 'decode') {
      setOutput(decodeHtmlEntities(input));
    } else {
      setOutput(encodeHtmlEntities(input));
    }
  }, [input, mode]);

  return (
    <div className={styles.container}>
      <div className={styles.controlPanel}>
        <div className={styles.controlGroup}>
          <span className={styles.label}>操作:</span>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="mode"
              value="decode"
              checked={mode === 'decode'}
              onChange={() => setMode('decode')}
            />
            解码
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="mode"
              value="encode"
              checked={mode === 'encode'}
              onChange={() => setMode('encode')}
            />
            编码
          </label>
        </div>
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输入</div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 HTML..."
          />
        </div>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输出</div>
          <textarea
            className={`${styles.textarea} ${styles.outputTextarea}`}
            value={output}
            readOnly
            placeholder="结果将显示在这里..."
          />
        </div>
      </div>
    </div>
  );
}
