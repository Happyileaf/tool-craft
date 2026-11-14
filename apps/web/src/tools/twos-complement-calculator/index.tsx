'use client';

import { Alert, Card, Input, Select, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_BITS_INPUT,
  DEFAULT_DECIMAL_INPUT,
  DEFAULT_OPERAND_A,
  DEFAULT_OPERAND_B,
  DEFAULT_OPERATION,
  DEFAULT_WIDTH,
  OPERATION_OPTIONS,
  WIDTH_OPTIONS,
} from './constants';
import {
  computeOperation,
  parseIntegerInput,
  signExtendedBinary,
  viewFromBits,
  viewFromSigned,
} from './utils/twos-complement';
import type { BitPatternView, BitWidth, TwosComplementOperation } from './utils/twos-complement';
import styles from './index.module.css';

function toError(error: unknown): string {
  return error instanceof Error ? error.message : '计算失败';
}

/** 按 4 位一组展示二进制，便于阅读 */
function groupBinary(binary: string): string {
  return binary.replace(/(.{4})(?=.)/g, '$1 ');
}

type ViewResult = { ok: true; view: BitPatternView } | { ok: false; error: string };

type OpResult =
  | { ok: true; result: ReturnType<typeof computeOperation> }
  | { ok: false; error: string };

export default function TwosComplementCalculatorTool(_props: ToolComponentProps) {
  const [width, setWidth] = useState<BitWidth>(DEFAULT_WIDTH);
  const [decimalInput, setDecimalInput] = useState(DEFAULT_DECIMAL_INPUT);
  const [bitsInput, setBitsInput] = useState(DEFAULT_BITS_INPUT);
  const [operandA, setOperandA] = useState(DEFAULT_OPERAND_A);
  const [operandB, setOperandB] = useState(DEFAULT_OPERAND_B);
  const [operation, setOperation] = useState<TwosComplementOperation>(DEFAULT_OPERATION);

  const fromDecimal = useMemo<ViewResult>(() => {
    try {
      return { ok: true, view: viewFromSigned(parseIntegerInput(decimalInput), width) };
    } catch (error) {
      return { ok: false, error: toError(error) };
    }
  }, [decimalInput, width]);

  const fromBits = useMemo<ViewResult>(() => {
    try {
      return { ok: true, view: viewFromBits(parseIntegerInput(bitsInput), width) };
    } catch (error) {
      return { ok: false, error: toError(error) };
    }
  }, [bitsInput, width]);

  const arithmetic = useMemo<OpResult>(() => {
    try {
      return {
        ok: true,
        result: computeOperation(
          parseIntegerInput(operandA),
          parseIntegerInput(operandB),
          width,
          operation,
        ),
      };
    } catch (error) {
      return { ok: false, error: toError(error) };
    }
  }, [operandA, operandB, width, operation]);

  const renderView = (view: BitPatternView) => (
    <div className={styles.grid}>
      <div className={styles.stat}>
        <span className={styles.label}>有符号值</span>
        <span className={styles.value}>{view.signed.toString()}</span>
        <span className={styles.sub}>
          取值范围 {view.min.toString()} … {view.max.toString()}
        </span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>无符号值</span>
        <span className={styles.value}>{view.unsigned.toString()}</span>
        <span className={styles.sub}>无符号上限 {view.unsignedMax.toString()}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>十六进制</span>
        <span className={styles.value}>{view.hex}</span>
        <span className={styles.sub}>符号位 {view.signBit}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>二进制补码</span>
        <span className={`${styles.value} ${styles.mono}`}>{groupBinary(view.binary)}</span>
        <span className={styles.sub}>{view.width} 位定宽</span>
      </div>
      <div className={`${styles.stat} ${styles.wide}`}>
        <span className={styles.label}>符号位延伸到 64 位</span>
        <span className={`${styles.value} ${styles.mono}`}>
          {groupBinary(signExtendedBinary(view.bits, view.width))}
        </span>
        <span className={styles.sub}>高位全部填充符号位，用于理解补码一致性</span>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="字长选择">
        <Space wrap align="center">
          <Select
            options={WIDTH_OPTIONS}
            value={width}
            onChange={(value) => setWidth(value as BitWidth)}
            style={{ width: 180 }}
          />
          <span className={styles.hint}>切换字长后，下方十进制与位模式会按新字长重新解释</span>
        </Space>
      </Card>

      <Card title="十进制 → 补码位模式">
        <div className={styles.field}>
          <span className={styles.label}>十进制有符号整数（支持 0x / 0b / 0o 前缀）</span>
          <Input
            value={decimalInput}
            onChange={(event) => setDecimalInput(event.target.value)}
            allowClear
            className={styles.numberInput}
            placeholder="如 -42"
          />
        </div>
        {!fromDecimal.ok ? (
          <Alert type="error" showIcon message={fromDecimal.error} />
        ) : (
          renderView(fromDecimal.view)
        )}
      </Card>

      <Card title="补码位模式 → 十进制">
        <div className={styles.field}>
          <span className={styles.label}>位模式（0x 十六进制 / 0b 二进制 / 十进制无符号值）</span>
          <Input
            value={bitsInput}
            onChange={(event) => setBitsInput(event.target.value)}
            allowClear
            className={styles.numberInput}
            placeholder="如 0b11010110"
          />
        </div>
        {!fromBits.ok ? (
          <Alert type="error" showIcon message={fromBits.error} />
        ) : (
          renderView(fromBits.view)
        )}
      </Card>

      <Card title="有符号整数运算与溢出检测">
        <div className={styles.inputs}>
          <div className={styles.field}>
            <span className={styles.label}>操作数 a</span>
            <Input
              value={operandA}
              onChange={(event) => setOperandA(event.target.value)}
              allowClear
              className={styles.numberInput}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>操作数 b（移位时为位数）</span>
            <Input
              value={operandB}
              onChange={(event) => setOperandB(event.target.value)}
              allowClear
              className={styles.numberInput}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>运算</span>
            <Select
              options={[...OPERATION_OPTIONS]}
              value={operation}
              onChange={(value) => setOperation(value)}
              style={{ width: 190 }}
            />
          </div>
        </div>

        {!arithmetic.ok ? (
          <Alert type="error" showIcon message={arithmetic.error} />
        ) : (
          <>
            <div className={styles.grid}>
              <div className={styles.stat}>
                <span className={styles.label}>精确结果</span>
                <span className={styles.value}>{arithmetic.result.exact.toString()}</span>
                <span className={styles.sub}>未受字长限制的数学结果</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>回绕后有符号值</span>
                <span className={styles.value}>{arithmetic.result.signed.toString()}</span>
                <span className={styles.sub}>
                  {arithmetic.result.overflow ? (
                    <Tag color="orange">发生溢出</Tag>
                  ) : (
                    <Tag color="green">无溢出</Tag>
                  )}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>结果十六进制</span>
                <span className={styles.value}>{arithmetic.result.hex}</span>
                <span className={styles.sub}>{width} 位字长</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>结果二进制补码</span>
                <span className={`${styles.value} ${styles.mono}`}>
                  {groupBinary(arithmetic.result.binary)}
                </span>
                <span className={styles.sub}>超出范围时按 2^{width} 回绕</span>
              </div>
            </div>
            {arithmetic.result.overflow && (
              <Alert
                type="warning"
                showIcon
                message="运算结果溢出"
                description={`精确结果 ${arithmetic.result.exact.toString()} 超出 ${width} 位有符号整数范围，位模式按 2^${width} 回绕为 ${arithmetic.result.signed.toString()}。C 语言中的有符号溢出属于未定义行为，实际程序需依赖无符号运算或显式检查。`}
              />
            )}
          </>
        )}
      </Card>

      <Card size="small" title="补码要点">
        <ul className={styles.notes}>
          <li>补码中最高位为符号位：0 表示非负，1 表示负数；n 位有符号范围为 −2^(n−1) 到 2^(n−1) − 1。</li>
          <li>负数 −x 的补码等于 2^n − x，等价于按位取反再加 1；例如 8 位的 −42 即 256 − 42 = 214 = 0xD6。</li>
          <li>符号位延伸保持数值不变：8 位的 0xD6 与 16 位的 0xFFD6、32 位的 0xFFFFFFD6 都表示 −42。</li>
          <li>算术右移保留符号位（负数补 1），逻辑右移在高位补 0，因此负数的两种右移结果不同。</li>
        </ul>
      </Card>
    </div>
  );
}
