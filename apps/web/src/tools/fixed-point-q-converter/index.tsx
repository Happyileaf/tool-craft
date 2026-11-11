'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  fixedAdd,
  fixedMul,
  floatToFixed,
  formatInfo,
  toComplementStrings,
  type RoundingMode,
} from './utils/fixedPoint';
import {
  BITS_OPTIONS,
  DEFAULT_BITS,
  DEFAULT_DECIMAL_INPUT,
  DEFAULT_FRAC_BITS,
  DEFAULT_OP_A,
  DEFAULT_OP_B,
  ROUNDING_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 定点数 Qm.n 转换与运算可视化器：在十进制小数与有符号二进制定点补码之间
 * 双向转换，展示精度、可表示范围与饱和边界，并演示同格式定点加法/乘法的
 * 整数定标过程、舍入与溢出。全部为本地 BigInt 整数运算，无网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认小数输入
 * @returns 定点数转换与运算界面
 */
const FixedPointQConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [bits, setBits] = React.useState<number>(DEFAULT_BITS);
  const [fracBits, setFracBits] = React.useState<number>(DEFAULT_FRAC_BITS);
  const [decimalInput, setDecimalInput] = React.useState<string>(
    defaultInput || DEFAULT_DECIMAL_INPUT,
  );
  const [rounding, setRounding] = React.useState<RoundingMode>('nearest');

  const [opA, setOpA] = React.useState<string>(DEFAULT_OP_A);
  const [opB, setOpB] = React.useState<string>(DEFAULT_OP_B);
  const [operator, setOperator] = React.useState<'+' | '×'>('+');

  // 小数位合法范围随位宽变化：0 ≤ n ≤ bits-1
  React.useEffect(() => {
    if (fracBits > bits - 1) {
      setFracBits(bits - 1);
    }
  }, [bits, fracBits]);

  const info = React.useMemo(() => {
    try {
      return { data: formatInfo(bits, fracBits), error: null as string | null };
    } catch (caught) {
      return { data: null, error: caught instanceof Error ? caught.message : '格式非法' };
    }
  }, [bits, fracBits]);

  const conversion = React.useMemo(() => {
    if (!decimalInput.trim() || !info.data) {
      return null;
    }
    const value = Number(decimalInput);
    if (!Number.isFinite(value)) {
      return { error: '请输入有限数值' };
    }
    try {
      const r = floatToFixed(value, bits, fracBits, rounding);
      const c = toComplementStrings(r.raw, bits);
      return { result: { ...r, ...c }, error: null as string | null };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : '转换失败' };
    }
  }, [decimalInput, bits, fracBits, rounding, info.data]);

  const arithmetic = React.useMemo(() => {
    if (!info.data || !opA.trim() || !opB.trim()) {
      return null;
    }
    const a = Number(opA);
    const b = Number(opB);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return { error: '两个操作数都必须是有限数值' };
    }
    try {
      const ra = floatToFixed(a, bits, fracBits, rounding).raw;
      const rb = floatToFixed(b, bits, fracBits, rounding).raw;
      const r = operator === '+'
        ? fixedAdd(ra, rb, bits, fracBits)
        : fixedMul(ra, rb, bits, fracBits, rounding);
      const c = toComplementStrings(r.raw, bits);
      return {
        result: {
          ra,
          rb,
          raw: r.raw,
          value: r.value,
          overflow: r.overflow,
          roundingError: r.roundingError,
          binary: c.binary,
          hex: c.hex,
        },
        error: null as string | null,
      };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : '运算失败' };
    }
  }, [opA, opB, operator, bits, fracBits, rounding, info.data]);

  return (
    <div className={styles.container}>
      <Card className={styles.card} title={`Q 格式配置（当前 Q${bits - fracBits - 1}.${fracBits}）`}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>总位宽：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={bits}
              onChange={(event) => setBits(Number(event.target.value))}
              options={BITS_OPTIONS}
            />
            <span className={styles.label}>小数位数 n：</span>
            <InputNumber
              className={styles.numberInput}
              min={0}
              max={bits - 1}
              precision={0}
              value={fracBits}
              onChange={(value) => setFracBits(value ?? 0)}
            />
            <span className={styles.label}>舍入：</span>
            <Select
              style={{ width: 180 }}
              value={rounding}
              onChange={(value) => setRounding(value)}
              options={ROUNDING_OPTIONS}
            />
          </div>
          {info.error ? (
            <Alert type="error" showIcon message="格式非法" description={info.error} />
          ) : info.data ? (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="整数位数 m">{info.data.m}</Descriptions.Item>
              <Descriptions.Item label="精度 2^-n">
                {info.data.precision.toExponential(6)}
              </Descriptions.Item>
              <Descriptions.Item label="最小可表示值">
                <span className={styles.mono}>{info.data.minRepresentable}</span>
              </Descriptions.Item>
              <Descriptions.Item label="最大可表示值">
                <span className={styles.mono}>{info.data.maxRepresentable}</span>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Space>
      </Card>

      <Card className={styles.card} title="小数 → Qm.n 定点补码">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>十进制小数：</span>
            <Input
              className={styles.decimalInput}
              value={decimalInput}
              onChange={(event) => setDecimalInput(event.target.value)}
              placeholder="如 0.5、-1、0.9999"
              spellCheck={false}
            />
          </div>
          {conversion?.error && (
            <Alert type="error" showIcon message="转换失败" description={conversion.error} />
          )}
          {conversion?.result && (
            <>
              {conversion.result.saturated && (
                <Alert
                  type="warning"
                  showIcon
                  message="输入超出可表示范围，已饱和到边界值"
                />
              )}
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="补码整数 raw（十进制）">
                  <span className={styles.mono}>{conversion.result.raw.toString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label="十六进制补码">
                  <Space>
                    <span className={styles.mono}>{conversion.result.hex}</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={async () => {
                        await copyToClipboard(conversion.result!.hex);
                        message.success('复制成功');
                      }}
                    >
                      复制
                    </Button>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="二进制补码">
                  <span className={styles.mono}>{conversion.result.binary}</span>
                </Descriptions.Item>
                <Descriptions.Item label="实际存储值（反解）">
                  <span className={styles.mono}>{conversion.result.value}</span>
                </Descriptions.Item>
                <Descriptions.Item label="量化误差">
                  <span className={styles.mono}>
                    {conversion.result.quantizationError.toExponential(6)}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
          <div className={styles.hint}>
            真实值 = raw ÷ 2^n；负数以二补码存储（如 Q15 下 -1 对应 0x8000）。超出范围的输入不会回绕，
            而是饱和到正/负边界并给出告警。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title="定点加法 / 乘法定标演示">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <Input
              className={styles.decimalInput}
              value={opA}
              onChange={(event) => setOpA(event.target.value)}
              placeholder="操作数 A"
              spellCheck={false}
            />
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              options={[
                { label: 'A + B', value: '+' },
                { label: 'A × B', value: '×' },
              ]}
            />
            <Input
              className={styles.decimalInput}
              value={opB}
              onChange={(event) => setOpB(event.target.value)}
              placeholder="操作数 B"
              spellCheck={false}
            />
          </div>
          {arithmetic?.error && (
            <Alert type="error" showIcon message="运算失败" description={arithmetic.error} />
          )}
          {arithmetic?.result && (
            <>
              {arithmetic.result.overflow && (
                <Alert type="warning" showIcon message="运算结果溢出，已饱和到边界值" />
              )}
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="操作数 raw">
                  <span className={styles.mono}>
                    A = {arithmetic.result.ra.toString()}，B = {arithmetic.result.rb.toString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="结果 raw / 补码">
                  <Space>
                    <span className={styles.mono}>{arithmetic.result.raw.toString()}</span>
                    <Tag color="blue">{arithmetic.result.hex}</Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="结果二进制">
                  <span className={styles.mono}>{arithmetic.result.binary}</span>
                </Descriptions.Item>
                <Descriptions.Item label="结果真实值">
                  <span className={styles.mono}>{arithmetic.result.value}</span>
                </Descriptions.Item>
                <Descriptions.Item label="舍入误差（乘法）">
                  <span className={styles.mono}>
                    {arithmetic.result.roundingError.toExponential(6)}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
          <div className={styles.hint}>
            加法直接对 raw 整数相加；乘法先得到 2×位宽的 Q(2m+1).2n 整数乘积，再右移 n 位定标回
            Qm.n，右移过程按所选模式舍入。反解校验：{opA || 'A'} {operator === '+' ? '+' : '×'}{' '}
            {opB || 'B'} 的精确结果应与上方真实值接近，差值即舍入误差。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default FixedPointQConverter;
