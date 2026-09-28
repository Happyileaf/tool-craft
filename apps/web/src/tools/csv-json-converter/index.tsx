import { useState, useEffect } from 'react';
import { ToolComponentProps } from '../constants';
import { DEFAULT_CSV_SAMPLE, DEFAULT_JSON_SAMPLE } from './constants';
import { csvToJson, jsonToCsv } from './utils/convert';

import styles from './index.module.scss';
import { ToolCategoryEnum } from '../constants';

type Direction = 'csvToJson' | 'jsonToCsv';

export default function CsvJsonConverter({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput || DEFAULT_CSV_SAMPLE);
  const [direction, setDirection] = useState<Direction>('csvToJson');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [headerFirst, setHeaderFirst] = useState(true);

  useEffect(() => {
    try {
      setError(null);
      if (direction === 'csvToJson') {
        const result = csvToJson(input, headerFirst);
        setOutput(JSON.stringify(result, null, 2));
      } else {
        const result = jsonToCsv(input);
        setOutput(result);
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, direction, headerFirst]);

  function swapDirection() {
    setInput(output);
    setDirection(direction === 'csvToJson' ? 'jsonToCsv' : 'csvToJson');
  }

  const directionLabel: Record<Direction, string> = {
    csvToJson: 'CSV → JSON',
    jsonToCsv: 'JSON → CSV',
  };

  const inputPlaceholder: Record<Direction, string> = {
    csvToJson: '在此粘贴 CSV...',
    jsonToCsv: '在此粘贴 JSON...',
  };

  return (
    <div className={styles.container}>
      <div className={styles.controlPanel}>
        <div className={styles.directionSelector}>
          <span className={styles.directionLabel}>{directionLabel[direction]}</span>
          <button className={styles.swapButton} onClick={swapDirection} title="交换方向">
            ⇄
          </button>
        </div>
        {direction === 'csvToJson' && (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={headerFirst}
              onChange={(e) => setHeaderFirst(e.target.checked)}
            />
            <span>第一行为表头</span>
          </label>
        )}
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输入</div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={inputPlaceholder[direction]}
          />
        </div>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>输出</div>
          {error && <div className={styles.error}>{error}</div>}
          <textarea
            className={`${styles.textarea} ${styles.outputTextarea}`}
            value={output}
            readOnly
            placeholder="转换结果将显示在这里..."
          />
        </div>
      </div>
    </div>
  );
}
