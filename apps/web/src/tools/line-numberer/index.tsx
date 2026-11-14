'use client';

import { Alert, Button, Card, Input, InputNumber, Segmented, Select, Space, Switch, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_SAMPLE_TEXT,
  MAX_PAD_WIDTH,
  MAX_START,
  MAX_STEP,
  SEPARATOR_OPTIONS,
} from './constants';
import { addLineNumbers, stripLineNumbers, validateOptions } from './utils/line-number';
import styles from './index.module.css';

type Mode = 'add' | 'strip';

export default function LineNumbererTool({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput ?? DEFAULT_SAMPLE_TEXT);
  const [mode, setMode] = useState<Mode>('add');
  const [start, setStart] = useState(1);
  const [step, setStep] = useState(1);
  const [separator, setSeparator] = useState(': ');
  const [padWidth, setPadWidth] = useState(0);
  const [numberBlankLines, setNumberBlankLines] = useState(false);

  const result = useMemo<{ output: string; error: string | null }>(() => {
    try {
      if (mode === 'strip') {
        return { output: stripLineNumbers(input), error: null };
      }
      validateOptions({ start, step, separator, padWidth, numberBlankLines });
      return {
        output: addLineNumbers(input, { start, step, separator, padWidth, numberBlankLines }),
        error: null,
      };
    } catch (error) {
      return { output: '', error: error instanceof Error ? error.message : '参数错误' };
    }
  }, [input, mode, start, step, separator, padWidth, numberBlankLines]);

  const stats = useMemo(() => {
    const lines = input === '' ? [] : input.split('\n');
    const blankCount = lines.filter((line) => line.trim() === '').length;
    const resultLines = result.output === '' ? [] : result.output.split('\n');
    return {
      total: lines.length,
      blank: blankCount,
    };
  }, [input]);

  const handleCopy = async () => {
    if (result.output === '') {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(result.output);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  const handleDownload = () => {
    if (result.output === '') {
      message.warning('没有可下载的内容');
      return;
    }
    const blob = new Blob([result.output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = mode === 'add' ? 'numbered.txt' : 'stripped.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.toolbar}>
          <Segmented<Mode>
            options={[
              { label: '添加行号', value: 'add' },
              { label: '剥离行号', value: 'strip' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Space wrap>
            <Button onClick={() => setInput(DEFAULT_SAMPLE_TEXT)}>载入样例</Button>
            <Button onClick={() => setInput('')}>清空输入</Button>
          </Space>
        </div>

        {mode === 'add' && (
          <div className={styles.options}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>起始编号</span>
              <InputNumber
                min={0}
                max={MAX_START}
                precision={0}
                value={start}
                onChange={(value) => setStart(value ?? 1)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>步长</span>
              <InputNumber
                min={1}
                max={MAX_STEP}
                precision={0}
                value={step}
                onChange={(value) => setStep(value ?? 1)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>分隔符</span>
              <Select
                options={SEPARATOR_OPTIONS}
                value={separator}
                onChange={setSeparator}
                style={{ width: 180 }}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>对齐宽度（0 = 自动）</span>
              <InputNumber
                min={0}
                max={MAX_PAD_WIDTH}
                precision={0}
                value={padWidth}
                onChange={(value) => setPadWidth(value ?? 0)}
              />
            </label>
            <label className={styles.switchField}>
              <Switch checked={numberBlankLines} onChange={setNumberBlankLines} />
              <span>空行也编号</span>
            </label>
          </div>
        )}

        {mode === 'strip' && (
          <Alert
            type="info"
            showIcon
            message="自动识别行首的「数字 + : . ) | Tab」编号前缀并移除；无前缀的行原样保留。"
          />
        )}
      </Card>

      {result.error && <Alert type="error" showIcon message={result.error} />}

      <div className={styles.editors}>
        <Card title="输入文本" size="small" className={styles.editorCard}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="粘贴需要编号或剥离行号的多行文本"
          />
        </Card>
        <Card
          title="输出结果"
          size="small"
          className={styles.editorCard}
          extra={<span className={styles.stats}>共 {stats.total} 行 · 空行 {stats.blank} 行</span>}
        >
          <Input.TextArea
            className={styles.mono}
            value={result.output}
            readOnly
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="处理结果将实时显示在这里"
          />
        </Card>
      </div>

      <Space wrap>
        <Button type="primary" onClick={handleCopy}>
          复制结果
        </Button>
        <Button onClick={handleDownload}>下载 .txt</Button>
      </Space>
    </div>
  );
}
