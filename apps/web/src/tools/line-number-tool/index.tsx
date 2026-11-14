'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, InputNumber, Radio, Select, Tag, message, type RadioChangeEvent } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { addLineNumbers, stripLineNumbers } from './utils/lineNumber';
import { DEFAULT_INPUT, SEPARATOR_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'add' | 'strip';

const LineNumberTool: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('add');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [start, setStart] = React.useState(1);
  const [step, setStep] = React.useState(1);
  const [padWidth, setPadWidth] = React.useState(0);
  const [separator, setSeparator] = React.useState(':');
  const [spaceAfter, setSpaceAfter] = React.useState(true);
  const [numberBlank, setNumberBlank] = React.useState(true);

  const result = React.useMemo(() => {
    if (mode === 'strip') {
      return { output: stripLineNumbers(input, SEPARATOR_OPTIONS), error: null as string | null };
    }
    const r = addLineNumbers(input, {
      start: Number(start),
      step: Number(step),
      separator,
      padWidth: Number(padWidth),
      numberBlankLines: numberBlank,
      spaceAfterSeparator: spaceAfter,
    });
    return { output: r.output, error: r.error };
  }, [mode, input, start, step, padWidth, separator, spaceAfter, numberBlank]);

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
      <Radio.Group
        value={mode}
        onChange={(e: RadioChangeEvent) => setMode(e.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={[
          { label: '添加行号', value: 'add' },
          { label: '剥离行号', value: 'strip' },
        ]}
      />

      {mode === 'add' ? (
        <Card size="small" title="行号参数">
          <div className={styles.controls}>
            <div className={styles.controlItem}>
              <span className={styles.controlLabel}>起始号</span>
              <InputNumber value={start} onChange={(v) => setStart(v ?? 0)} precision={0} style={{ width: '100%' }} />
            </div>
            <div className={styles.controlItem}>
              <span className={styles.controlLabel}>步长</span>
              <InputNumber value={step} onChange={(v) => setStep(v ?? 1)} precision={0} style={{ width: '100%' }} />
            </div>
            <div className={styles.controlItem}>
              <span className={styles.controlLabel}>零填充宽度（0=自动）</span>
              <InputNumber value={padWidth} min={0} onChange={(v) => setPadWidth(v ?? 0)} precision={0} style={{ width: '100%' }} />
            </div>
            <div className={styles.controlItem}>
              <span className={styles.controlLabel}>分隔符</span>
              <Select
                value={separator}
                onChange={setSeparator}
                options={SEPARATOR_OPTIONS.map((sep) => ({ label: sep, value: sep }))}
              />
            </div>
            <div className={styles.controlItem}>
              <span className={styles.controlLabel}>选项</span>
              <div className={styles.inlineChecks}>
                <Checkbox checked={spaceAfter} onChange={(e) => setSpaceAfter(e.target.checked)}>
                  分隔符后空格
                </Checkbox>
                <Checkbox checked={numberBlank} onChange={(e) => setNumberBlank(e.target.checked)}>
                  空行编号
                </Checkbox>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <div className={styles.panels}>
        <Card className={styles.card} title={mode === 'add' ? '原始文本' : '带行号文本'}>
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={mode === 'add' ? '粘贴需要编号的多行文本…' : '粘贴带行号前缀的文本…'}
          />
        </Card>

        <Card
          className={styles.card}
          title={mode === 'add' ? '带行号结果' : '还原结果'}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {result.error ? (
            <Alert type="error" showIcon message={result.error} style={{ marginBottom: 12 }} />
          ) : null}
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Tag color="geekblue">纯字符串处理</Tag>
        <span className={styles.hint}>
          纯本地零依赖；剥离模式自动识别「数字 + 分隔符 + 空白」前缀，无前缀行原样保留
        </span>
      </div>
    </div>
  );
};

export default LineNumberTool;
