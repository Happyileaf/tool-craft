'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  BINARY_OP_OPTIONS,
  SHIFT_OP_OPTIONS,
  WIDTH_OPTIONS,
} from './constants';
import {
  binaryOp,
  lsbIndex,
  maxMask,
  msbIndex,
  nandOp,
  normalize,
  notOp,
  parseMask,
  popCount,
  shift,
  testBit,
  toBinaryString,
  toHexString,
  toOctalString,
  toSigned,
  toggleBit,
  type BitWidth,
  type BinaryOp,
  type ShiftOp,
} from './utils/bitmask';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * 位掩码可视化计算器：逐位勾选、进制互转、双掩码位运算、移位与位统计
 *
 * @returns 位掩码交互界面
 */
const BitmaskCalculator: React.FC<ToolComponentProps> = () => {
  const [width, setWidth] = React.useState<BitWidth>(8);
  const [mask, setMask] = React.useState<bigint>(BigInt(0b10101010));
  const [decimalInput, setDecimalInput] = React.useState<string>('170');
  const [error, setError] = React.useState<string | null>(null);
  const [signedView, setSignedView] = React.useState<boolean>(false);
  const [secondMaskInput, setSecondMaskInput] = React.useState<string>('0xF0');
  const [binaryOpType, setBinaryOpType] = React.useState<BinaryOp>('and');
  const [shiftOpType, setShiftOpType] = React.useState<ShiftOp>('shl');
  const [shiftAmount, setShiftAmount] = React.useState<string>('1');

  /**
   * 应用一次掩码变更，统一做位宽规范化并同步十进制输入框
   */
  const applyMask = (next: bigint) => {
    const normalized = normalize(next, width);
    setMask(normalized);
    setDecimalInput(normalized.toString());
    setError(null);
  };

  /** 从十进制输入框解析并应用 */
  const handleDecimalCommit = () => {
    try {
      applyMask(parseMask(decimalInput, width));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '输入解析失败');
    }
  };

  /** 点击单个 bit 单元格：翻转该位 */
  const handleBitClick = (bit: number) => {
    applyMask(toggleBit(mask, bit, width));
  };

  /** 快捷置位 / 清位 */
  const handleSetAll = () => applyMask(maxMask(width));
  const handleClearAll = () => applyMask(BigInt(0));

  /** 复制当前二进制串 */
  const handleCopyBinary = async () => {
    await copyToClipboard(toBinaryString(mask, width));
    message.success('二进制已复制');
  };

  // 派生展示值
  const binary = toBinaryString(mask, width);
  const hex = toHexString(mask);
  const octal = toOctalString(mask);
  const signed = toSigned(mask, width);

  // 双掩码运算结果（错误时不渲染数值）
  let secondResult: string | null = null;
  let secondError: string | null = null;
  try {
    const second = parseMask(secondMaskInput, width);
    const value =
      binaryOpType === 'and' || binaryOpType === 'or' || binaryOpType === 'xor'
        ? binaryOp(mask, second, binaryOpType, width)
        : BigInt(0);
    const nand = nandOp(mask, second, width);
    const notValue = notOp(mask, width);
    secondResult = [
      `A ${binaryOpType.toUpperCase()} B = 0x${toHexString(value)}（${value.toString()}）`,
      `A NAND B = 0x${toHexString(nand)}（${nand.toString()}）`,
      `NOT A    = 0x${toHexString(notValue)}（${notValue.toString()}）`,
    ].join('\n');
  } catch (caught) {
    secondError = caught instanceof Error ? caught.message : '运算失败';
  }

  // 移位结果
  let shiftResult: string | null = null;
  let shiftError: string | null = null;
  try {
    const amount = Number.parseInt(shiftAmount, 10);
    const value = shift(mask, amount, shiftOpType, width);
    shiftResult = `${SHIFT_OP_OPTIONS.find((item) => item.value === shiftOpType)?.label} ${amount} 位 → 0x${toHexString(value)}（${value.toString()} / ${toBinaryString(value, width)}）`;
  } catch (caught) {
    shiftError = caught instanceof Error ? caught.message : '移位失败';
  }

  return (
    <div className={styles.container}>
      <Card
        title="位宽与输入"
        extra={
          <Space>
            <span>有符号视图</span>
            <Switch checked={signedView} onChange={setSignedView} />
          </Space>
        }
      >
        <Space wrap className="mb-4">
          <Select
            value={width}
            onChange={(value: BitWidth) => {
              setWidth(value);
              applyMask(normalize(mask, value));
            }}
            options={WIDTH_OPTIONS}
            style={{ width: 160 }}
          />
          <Input
            value={decimalInput}
            onChange={(event) => setDecimalInput(event.target.value)}
            onBlur={handleDecimalCommit}
            onPressEnter={handleDecimalCommit}
            placeholder="十进制，或在结果区查看其他进制"
            style={{ width: 260, fontFamily: 'ui-monospace, monospace' }}
          />
          <Button onClick={handleSetAll}>全部置 1</Button>
          <Button onClick={handleClearAll}>全部清 0</Button>
        </Space>

        {error && <Alert type="error" showIcon message={error} className="mb-3" />}

        <div className={styles.bitGrid}>
          {Array.from({ length: width }, (_, index) => width - 1 - index).map((bit) => {
            const on = testBit(mask, bit, width);
            return (
              <div key={bit} className={styles.bitCell}>
                <span className={styles.bitIndex}>{bit}</span>
                <button
                  type="button"
                  className={`${styles.bitButton} ${on ? styles.bitButtonOn : styles.bitButtonOff}`}
                  onClick={() => handleBitClick(bit)}
                  aria-label={`bit ${bit}，当前 ${on ? 1 : 0}，点击翻转`}
                >
                  {on ? 1 : 0}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="进制与位统计"
        extra={
          <Button icon={<CopyOutlined />} onClick={handleCopyBinary}>
            复制二进制
          </Button>
        }
      >
        <Space direction="vertical" className="w-full" size="small">
          <div className={styles.mono}>
            <Tag color="blue">BIN</Tag>
            {binary}
          </div>
          <div className={styles.mono}>
            <Tag color="purple">OCT</Tag>
            {octal}
          </div>
          <div className={styles.mono}>
            <Tag color="geekblue">HEX</Tag>
            0x{hex}
          </div>
          <div className={styles.mono}>
            <Tag color="green">DEC</Tag>
            {signedView ? `${signed.toString()}（有符号） / ` : ''}
            {mask.toString()}（无符号）
          </div>
        </Space>

        <div className={`${styles.statGrid} mt-4`}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>MSB 最高有效位</div>
            <div className={styles.statValue}>{msbIndex(mask)}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>LSB 最低有效位</div>
            <div className={styles.statValue}>{lsbIndex(mask)}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Popcount 置 1 位数</div>
            <div className={styles.statValue}>{popCount(mask)}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>位宽上限</div>
            <div className={styles.statValue}>{maxMask(width).toString()}</div>
          </div>
        </div>
      </Card>

      <Card title="双掩码运算（A 为当前掩码，B 在下方输入）">
        <Space wrap className="mb-3">
          <Select
            value={binaryOpType}
            onChange={(value: BinaryOp) => setBinaryOpType(value)}
            options={BINARY_OP_OPTIONS}
            style={{ width: 160 }}
          />
          <Input
            value={secondMaskInput}
            onChange={(event) => setSecondMaskInput(event.target.value)}
            placeholder="B：十进制 / 0x / 0o / 0b"
            style={{ width: 240, fontFamily: 'ui-monospace, monospace' }}
          />
        </Space>
        {secondError ? (
          <Alert type="error" showIcon message={secondError} />
        ) : (
          <pre className={styles.mono}>{secondResult}</pre>
        )}
      </Card>

      <Card title="移位与循环移位">
        <Space wrap className="mb-3">
          <Select
            value={shiftOpType}
            onChange={(value: ShiftOp) => setShiftOpType(value)}
            options={SHIFT_OP_OPTIONS}
            style={{ width: 180 }}
          />
          <Input
            value={shiftAmount}
            onChange={(event) => setShiftAmount(event.target.value)}
            placeholder="位数"
            style={{ width: 100, fontFamily: 'ui-monospace, monospace' }}
          />
        </Space>
        {shiftError ? (
          <Alert type="error" showIcon message={shiftError} />
        ) : (
          <pre className={styles.mono}>{shiftResult}</pre>
        )}
      </Card>
    </div>
  );
};

export default BitmaskCalculator;
