'use client';

import { useState, useEffect } from 'react';
import { ToolComponentProps } from '../loaders';
import { DEFAULT_SAMPLE } from './constants';
import { encodeUrl, decodeUrl, encodeUri, decodeUri } from './utils/codec';

import styles from './index.module.scss';

type Mode = 'encode' | 'decode';
type Type = 'component' | 'full';

export default function UrlCodec({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput || DEFAULT_SAMPLE);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [type, setType] = useState<Type>('component');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setError(null);
      if (mode === 'encode') {
        if (type === 'component') {
          setOutput(encodeUrl(input));
        } else {
          setOutput(encodeUri(input));
        }
      } else {
        if (type === 'component') {
          setOutput(decodeUrl(input));
        } else {
          setOutput(decodeUri(input));
        }
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, mode, type]);

  const modeLabel: Record<Mode, string> = {
    encode: '编码',
    decode: '解码',
  };

  const typeLabel: Record<Type, string> = {
    component: 'URL 组件编码',
    full: '完整 URI 编码',
  };

  return (
    <div className={styles.container}>
      <div className={styles.controlPanel}>
        <div className={styles.controlGroup}>
          <span className={styles.label}>操作:</span>
          {(['encode', 'decode'] as Mode[]).map(m => (
            <label key={m} className={styles.radioLabel}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              {modeLabel[m]}
            </label>
          ))}
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.label}>类型:</span>
          {(['component', 'full'] as Type[]).map(t => (
            <label key={t} className={styles.radioLabel}>
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
              />
              {typeLabel[t]}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输入</div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入..."
          />
        </div>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输出</div>
          {error && <div className={styles.error}>{error}</div>}
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
