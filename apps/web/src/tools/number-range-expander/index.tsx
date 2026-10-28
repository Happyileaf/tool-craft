'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Segmented, Select, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { collapseRanges, expandRanges } from './utils/range';
import { DEFAULT_INPUT, SEPARATOR_OPTIONS, type RangeDirection } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const NumberRangeExpander: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<RangeDirection>('expand');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [separator, setSeparator] = React.useState(',');

  const result = React.useMemo(() => {
    const parsed = direction === 'expand' ? expandRanges(input) : collapseRanges(input);
    if (parsed.error) {
      return { output: '', error: parsed.error, count: parsed.values.length };
    }
    return {
      output: parsed.values.map((v) => v.toString()).join(separator),
      error: null,
      count: parsed.values.length,
    };
  }, [direction, input, separator]);

  const handleCopy = () => {
    if (result.output.trim() === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Segmented<RangeDirection>
          value={direction}
          onChange={(value) => setDirection(value)}
          options={[
            { label: '展开区间 → 数列', value: 'expand' },
            { label: '压缩数列 → 区间', value: 'collapse' },
          ]}
        />
        <span className={styles.hint}>
          {direction === 'expand'
            ? '语法：1-5（闭区间）、0-10:2（步长）、-5--1（负终点）；逗号 / 空格 / 换行分隔'
            : '输入离散整数，自动排序去重；连续 ≥3 个数合并为 a-b'}
        </span>
      </div>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={direction === 'expand' ? '输入（区间表达式）' : '输入（离散整数列表）'}
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={
              direction === 'expand'
                ? '1-5, 10, 12-14\n0-10:2\n-5--1'
                : '5,3,1,2,4,4,6,8'
            }
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
          {result.error ? (
            <Alert
              type="error"
              showIcon
              className={styles.errorItem}
              message={result.error}
            />
          ) : null}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Tag color="blue">BigInt 任意精度</Tag>
        <Tag color={result.error ? 'default' : 'green'}>
          {result.error ? '解析失败' : `${result.count} 个元素`}
        </Tag>
        <span className={styles.fieldLabel}>输出分隔符</span>
        <Select
          size="small"
          className={styles.separatorSelect}
          value={separator}
          onChange={(value: string) => setSeparator(value)}
          options={SEPARATOR_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
        />
        <span className={styles.hint}>
          展开结果上限 100000 个元素；全部计算在浏览器本地完成
        </span>
      </div>
    </div>
  );
};

export default NumberRangeExpander;
