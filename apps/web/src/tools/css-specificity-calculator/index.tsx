'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Empty, Input, Tag } from 'antd';
import { DEFAULT_SELECTORS, SPECIFICITY_COLUMN_LABELS } from './constants';
import {
  calculateSpecificityLines,
  compareSpecificity,
  formatSpecificity,
  type Specificity,
} from './utils/specificity';
import styles from './index.module.css';

/**
 * CSS 选择器权重计算器：逐行解析选择器，输出标准三元组 (a, b, c)，
 * 并在所有合法行中标记权重最高的一条；全部计算在浏览器本地实时完成
 *
 * @returns CSS 选择器权重计算器交互界面
 */
const CssSpecificityCalculator: React.FC<ToolComponentProps> = () => {
  const [text, setText] = React.useState(DEFAULT_SELECTORS);

  const results = React.useMemo(() => calculateSpecificityLines(text), [text]);

  const highest = React.useMemo<Specificity | null>(() => {
    let best: Specificity | null = null;
    for (const result of results) {
      if (result.valid && result.specificity !== null) {
        if (best === null || compareSpecificity(result.specificity, best) > 0) {
          best = result.specificity;
        }
      }
    }
    return best;
  }, [results]);

  let highestShown = false;

  return (
    <div className={styles.container}>
      <Card title="CSS 选择器权重计算器">
        <Input.TextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoSize={{ minRows: 4, maxRows: 14 }}
          spellCheck={false}
          placeholder="每行输入一个 CSS 选择器，例如：#nav .item > a:hover"
        />
        <div className={styles.legend}>
          <Tag color="red">a · {SPECIFICITY_COLUMN_LABELS.a}</Tag>
          <Tag color="blue">b · {SPECIFICITY_COLUMN_LABELS.b}</Tag>
          <Tag color="green">c · {SPECIFICITY_COLUMN_LABELS.c}</Tag>
          <span className={styles.subtle}>
            :is() / :not() / :has() 采纳参数最高权重；:where() 恒为 0
          </span>
        </div>

        {results.length === 0 ? (
          <Empty style={{ marginTop: 24 }} description="请输入至少一个选择器" />
        ) : (
          <div className={styles.resultList}>
            {results.map((result, index) => {
              const isHighest =
                result.valid &&
                result.specificity !== null &&
                highest !== null &&
                compareSpecificity(result.specificity, highest) === 0;
              const showWin = isHighest && !highestShown;
              if (isHighest) {
                highestShown = true;
              }
              if (!result.valid) {
                return (
                  <Alert
                    key={`${result.selector}-${index}`}
                    type="error"
                    showIcon
                    message={
                      <span>
                        <span className={styles.lineNo}>第 {index + 1} 行</span>
                        <code>{result.selector}</code>
                      </span>
                    }
                    description={result.reason ?? '无法解析为合法 CSS 选择器'}
                  />
                );
              }
              return (
                <div
                  key={`${result.selector}-${index}`}
                  className={`${styles.resultLine} ${showWin ? styles.resultLineHighest : ''}`}
                >
                  <span className={styles.lineNo}>#{index + 1}</span>
                  <span className={styles.selectorText}>{result.selector}</span>
                  <span className={styles.triple}>
                    {result.specificity !== null ? formatSpecificity(result.specificity) : ''}
                  </span>
                  {showWin ? <Tag color="green">权重最高</Tag> : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CssSpecificityCalculator;
