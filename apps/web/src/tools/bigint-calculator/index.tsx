'use client';

import { Alert, Button, Card, Input, Select, Space, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { BIGINT_OPERATIONS, computeBigInt } from './utils/bigint';
import type { BigIntComputation, BigIntOperation } from './utils/bigint';
import styles from './index.module.css';

const EXAMPLES: Array<{ label: string; operation: BigIntOperation; a: string; b: string; m: string }> = [
  { label: '2^100', operation: 'pow', a: '2', b: '100', m: '' },
  { label: '50!', operation: 'factorial', a: '50', b: '', m: '' },
  { label: '100 ÷ 7', operation: 'div', a: '100', b: '7', m: '' },
  { label: '3^200 mod 1e9+7', operation: 'modPow', a: '3', b: '200', m: '1000000007' },
];

type CalcResult = { ok: true; data: BigIntComputation } | { ok: false; error: string };

export default function BigIntCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [operation, setOperation] = useState<BigIntOperation>('pow');
  const [aText, setAText] = useState(defaultInput ?? '2');
  const [bText, setBText] = useState('100');
  const [modulusText, setModulusText] = useState('1000000007');

  const meta = BIGINT_OPERATIONS.find((item) => item.value === operation) ?? BIGINT_OPERATIONS[0];

  const result = useMemo<CalcResult>(() => {
    try {
      return { ok: true, data: computeBigInt(operation, aText, bText, modulusText) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [operation, aText, bText, modulusText]);

  const applyExample = (example: (typeof EXAMPLES)[number]) => {
    setOperation(example.operation);
    setAText(example.a);
    setBText(example.b);
    setModulusText(example.m);
  };

  const handleCopy = async () => {
    if (!result.ok) {
      message.warning('当前没有可复制的结果');
      return;
    }
    const data = result.data;
    const lines = [`十进制：${data.decimal}`, `十六进制：${data.hexadecimal}`, `二进制：${data.binary}`];
    if (data.quotient !== undefined && data.remainder !== undefined) {
      lines.unshift(
        `商：${data.quotient.toString()}`,
        `余数：${data.remainder.toString()}`,
      );
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      message.success('已复制结果');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="大整数运算">
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>运算</span>
            <Select
              value={operation}
              onChange={setOperation}
              options={BIGINT_OPERATIONS.map((item) => ({ label: item.label, value: item.value }))}
              style={{ width: 220 }}
            />
          </label>
          <label className={styles.operand}>
            <span className={styles.label}>操作数 A</span>
            <Input.TextArea
              value={aText}
              onChange={(event) => setAText(event.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="支持正负号与千位逗号"
            />
          </label>
          {operation !== 'factorial' && operation !== 'modInverse' ? (
            <label className={styles.operand}>
              <span className={styles.label}>操作数 B</span>
              <Input.TextArea
                value={bText}
                onChange={(event) => setBText(event.target.value)}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="支持正负号与千位逗号"
              />
            </label>
          ) : null}
          {operation === 'modPow' || operation === 'modInverse' ? (
            <label className={styles.operand}>
              <span className={styles.label}>模数 M（正整数）</span>
              <Input.TextArea
                value={modulusText}
                onChange={(event) => setModulusText(event.target.value)}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="如 1000000007"
              />
            </label>
          ) : null}
        </div>

        <div className={styles.examples}>
          <span className={styles.label}>示例：</span>
          {EXAMPLES.map((example) => (
            <Button key={example.label} size="small" onClick={() => applyExample(example)}>
              {example.label}
            </Button>
          ))}
          {meta ? <Tag>{meta.hint}</Tag> : null}
        </div>

        {!result.ok ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <>
            {result.data.quotient !== undefined && result.data.remainder !== undefined ? (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.label}>商</span>
                  <span className={styles.value}>{result.data.quotient.toString()}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>余数</span>
                  <span className={styles.value}>{result.data.remainder.toString()}</span>
                </div>
              </div>
            ) : null}

            <div className={styles.resultBlock}>
              <span className={styles.label}>十进制结果</span>
              <span className={styles.result}>{result.data.decimal}</span>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.label}>十六进制</span>
                <span className={styles.mono}>{result.data.hexadecimal}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>二进制</span>
                <span className={styles.mono}>{result.data.binary}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>位数统计</span>
                <span className={styles.sub}>
                  十进制 {result.data.decimalDigits} 位 / 二进制 {result.data.binaryBits} 位
                </span>
              </div>
            </div>

            <Space wrap>
              <Button onClick={handleCopy}>复制全部表示</Button>
            </Space>
          </>
        )}
      </Card>

      <Card size="small" title="计算说明">
        <ul className={styles.notes}>
          <li>所有运算基于浏览器内置 BigInt，精度不受 JavaScript Number 的 53 位安全整数限制。</li>
          <li>幂运算使用快速幂，指数上限 10000，且结果规模限制在约 20000 位十进制以内。</li>
          <li>阶乘上限 10000；模幂与模逆元要求模数为正整数，模逆元还要求 A 与 M 互质。</li>
          <li>整除结果同时给出商与余数；余数符号与被除数一致，模幂内部会先把底数归一化到 0–M−1。</li>
        </ul>
      </Card>
    </div>
  );
}
