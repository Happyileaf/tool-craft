'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  brailleToDots,
  decodeBraille,
  describeBraille,
  encodeText,
  isBraillePattern,
} from './utils/braille';
import { DEFAULT_INPUT, DIRECTION_OPTIONS, type BrailleDirection } from './constants';
import styles from './index.module.css';

/**
 * 单个盲文字符的六点格可视化：点号排列为
 * 1 4 / 2 5 / 3 6（8 点模式额外 7 8）
 */
const BrailleCell: React.FC<{ cell: string }> = ({ cell }) => {
  if (!isBraillePattern(cell)) {
    return (
      <div className={styles.cellBox}>
        <div className={styles.cellGlyph}>{cell === ' ' ? '␠' : cell}</div>
      </div>
    );
  }

  const info = describeBraille(cell);
  const active = new Set(info.dots);

  return (
    <div className={styles.cellBox}>
      <div className={styles.cellGlyph}>{cell}</div>
      <div className={styles.dotsGrid}>
        {[1, 4, 2, 5, 3, 6, 7, 8].map((dot) => (
          <span
            key={dot}
            className={`${styles.dot} ${active.has(dot) ? styles.dotActive : ''}`}
          />
        ))}
      </div>
      <span className={styles.cellCode}>{info.hex}</span>
    </div>
  );
};

const BrailleCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<BrailleDirection>('encode');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(
    () => (direction === 'encode' ? encodeText(input) : decodeBraille(input)),
    [input, direction],
  );

  const cells = React.useMemo(() => {
    if (direction !== 'encode' || !result.output) return [];
    return Array.from(result.output);
  }, [direction, result.output]);

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={direction}
          options={DIRECTION_OPTIONS}
          onChange={(e) => setDirection(e.target.value as BrailleDirection)}
        />
        <Tag color="blue">Unicode U+2800–U+28FF</Tag>
        <span className={styles.hint}>英文一级盲文（Grade 1），数字号 ⠼ 引导 0–9</span>
      </div>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={direction === 'encode' ? '文本输入' : '盲文输入'}
          extra={
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 8, maxRows: 18 }}
            placeholder={
              direction === 'encode'
                ? '输入字母、数字、空格与常用标点…'
                : '粘贴 U+2800–U+28FF 盲文字符…'
            }
          />
        </Card>

        <Card
          className={styles.card}
          title={direction === 'encode' ? '盲文输出' : '文本输出'}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <div className={styles.outputArea}>{result.output || '等待输入…'}</div>

          {direction === 'encode' && cells.length > 0 ? (
            <div className={styles.cells}>
              {cells.slice(0, 60).map((cell, index) => (
                <BrailleCell key={`${index}-${cell.codePointAt(0)}`} cell={cell} />
              ))}
            </div>
          ) : null}

          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.slice(0, 10).map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  message={warning}
                />
              ))}
              {result.warnings.length > 10 ? (
                <span className={styles.hint}>另有 {result.warnings.length - 10} 条提示…</span>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message="点号约定"
        description={
          <span>
            六点格左列从上到下为点 1、2、3，右列为点 4、5、6；计算机盲文扩展的点 7、8 位于底部。
            盲文字符码位 = 0x2800 + 凸点掩码。示例：a = 点1 = ⠁ = U+2801，b = 点 1,2 = ⠃ = U+2803。
          </span>
        }
      />
    </div>
  );
};

export default BrailleCodec;
