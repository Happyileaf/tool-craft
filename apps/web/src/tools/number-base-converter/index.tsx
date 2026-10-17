'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Select, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  BitwiseOpEnum,
  ShiftDirectionEnum,
  applyBitwise,
  applyBitwiseNot,
  applyShift,
  convertBase,
  formatBitGroups,
  parseInteger,
  popcount,
  toBaseString,
  type SupportedBase,
  type SupportedWidth,
} from './utils/base';
import {
  BASE_OPTIONS,
  BITWISE_OP_OPTIONS,
  DEFAULT_INPUT,
  DEFAULT_OPERAND_B,
  UNARY_OP_OPTIONS,
  UnaryOpEnum,
  WIDTH_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 进制互转与位运算工具，支持二进制 / 八进制 / 十进制 / 十六进制互转（BigInt 大整数）、
 * 按位宽分组展示二进制位与置位统计，以及 AND / OR / XOR / NOT / 位移运算，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 进制互转与位运算交互界面
 */
const NumberBaseConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [base, setBase] = React.useState<SupportedBase>(10);
  const [width, setWidth] = React.useState<SupportedWidth>(32);
  const [operandB, setOperandB] = React.useState<string>(DEFAULT_OPERAND_B);
  const [bitwiseOp, setBitwiseOp] = React.useState<BitwiseOpEnum>(BitwiseOpEnum.AND);
  const [unaryOp, setUnaryOp] = React.useState<UnaryOpEnum>(UnaryOpEnum.NOT);
  const [shiftAmount, setShiftAmount] = React.useState<number>(1);

  const conversion = React.useMemo(() => convertBase(input, base), [input, base]);
  const operandBParsed = React.useMemo(() => parseInteger(operandB, base), [operandB, base]);

  const binaryResult = React.useMemo<bigint | null>(() => {
    if (conversion.value === null || operandBParsed.value === null) {
      return null;
    }
    return applyBitwise(conversion.value, operandBParsed.value, bitwiseOp);
  }, [conversion.value, operandBParsed.value, bitwiseOp]);

  const unaryResult = React.useMemo<bigint | null>(() => {
    if (conversion.value === null) {
      return null;
    }
    if (unaryOp === UnaryOpEnum.NOT) {
      return applyBitwiseNot(conversion.value, width);
    }
    return applyShift(
      conversion.value,
      shiftAmount,
      width,
      unaryOp === UnaryOpEnum.SHL ? ShiftDirectionEnum.LEFT : ShiftDirectionEnum.RIGHT,
    );
  }, [conversion.value, unaryOp, shiftAmount, width]);

  const resultRows = [
    { label: `二进制 (2)`, value: conversion.binary },
    { label: `八进制 (8)`, value: conversion.octal },
    { label: `十进制 (10)`, value: conversion.decimal },
    { label: `十六进制 (16)`, value: conversion.hex },
  ];

  /**
   * 载入默认示例数值
   */
  const handleLoadSample = () => {
    setInput(DEFAULT_INPUT);
    setBase(10);
  };

  /**
   * 清空主输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制当前进制互转结果
   */
  const handleCopyConversion = async () => {
    if (!conversion.valid) {
      return;
    }
    const text = resultRows.map((row) => `${row.label}：${row.value}`).join('\n');
    await copyToClipboard(text);
    message.success('复制成功');
  };

  /**
   * 复制位运算结果（十进制）
   *
   * @param value - 待复制的整数
   */
  const handleCopyValue = async (value: bigint) => {
    await copyToClipboard(toBaseString(value, 10));
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card
        title="进制互转"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopyConversion}
              disabled={!conversion.valid}
            >
              复制结果
            </Button>
          </Space>
        }
      >
        <div className={styles.row}>
          <span className={styles.label}>输入进制：</span>
          <Select
            value={base}
            onChange={setBase}
            options={BASE_OPTIONS}
            style={{ width: 150 }}
          />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例如 255、0xFF、0b1111、-42"
            style={{ maxWidth: 320 }}
          />
        </div>

        {conversion.error ? (
          <Alert style={{ marginTop: 12 }} type="warning" showIcon message={conversion.error} />
        ) : (
          <div className={styles.results}>
            {resultRows.map((row) => (
              <div className={styles.resultItem} key={row.label}>
                <div className={styles.resultKey}>{row.label}</div>
                <div className={styles.resultValue}>{row.value}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="位可视化">
        <div className={styles.row}>
          <span className={styles.label}>位宽：</span>
          <Select
            value={width}
            onChange={setWidth}
            options={WIDTH_OPTIONS}
            style={{ width: 110 }}
          />
          {conversion.value !== null && (
            <span className={styles.meta}>
              置位（1）个数：{popcount(conversion.value, width)}
            </span>
          )}
        </div>
        {conversion.value !== null ? (
          <div className={styles.bits}>{formatBitGroups(conversion.value, width)}</div>
        ) : (
          <Alert style={{ marginTop: 12 }} type="info" showIcon message="输入合法数值后展示二进制位" />
        )}
      </Card>

      <Card title="位运算">
        <div className={styles.row}>
          <span className={styles.label}>A：</span>
          <span className={styles.meta}>
            {conversion.value !== null ? toBaseString(conversion.value, 10) : '—'}
          </span>
          <Select
            value={bitwiseOp}
            onChange={setBitwiseOp}
            options={BITWISE_OP_OPTIONS}
            style={{ width: 170 }}
          />
          <span className={styles.label}>B：</span>
          <Input
            value={operandB}
            onChange={(event) => setOperandB(event.target.value)}
            placeholder="例如 16"
            style={{ maxWidth: 160 }}
          />
        </div>
        {binaryResult !== null ? (
          <div className={styles.results}>
            <div className={styles.resultItem}>
              <div className={styles.resultKey}>十进制</div>
              <div className={styles.resultValue}>
                {toBaseString(binaryResult, 10)}
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyValue(binaryResult)}
                />
              </div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultKey}>十六进制</div>
              <div className={styles.resultValue}>0x{toBaseString(binaryResult, 16, true)}</div>
            </div>
          </div>
        ) : (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="A 或 B 不是合法数值，无法执行位运算"
          />
        )}

        <div className={styles.row} style={{ marginTop: 16 }}>
          <span className={styles.label}>一元运算：</span>
          <Select
            value={unaryOp}
            onChange={setUnaryOp}
            options={UNARY_OP_OPTIONS}
            style={{ width: 190 }}
          />
          {unaryOp !== UnaryOpEnum.NOT && (
            <>
              <span className={styles.label}>移位数：</span>
              <InputNumber
                min={0}
                value={shiftAmount}
                onChange={(value) => setShiftAmount(value ?? 0)}
                style={{ width: 90 }}
              />
            </>
          )}
        </div>
        {unaryResult !== null ? (
          <div className={styles.results}>
            <div className={styles.resultItem}>
              <div className={styles.resultKey}>十进制</div>
              <div className={styles.resultValue}>{toBaseString(unaryResult, 10)}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultKey}>十六进制</div>
              <div className={styles.resultValue}>0x{toBaseString(unaryResult, 16, true)}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultKey}>二进制位</div>
              <div className={styles.resultValue}>{formatBitGroups(unaryResult, width)}</div>
            </div>
          </div>
        ) : (
          <Alert style={{ marginTop: 12 }} type="info" showIcon message="A 为非法数值，无法执行一元运算" />
        )}
      </Card>
    </div>
  );
};

export default NumberBaseConverter;
