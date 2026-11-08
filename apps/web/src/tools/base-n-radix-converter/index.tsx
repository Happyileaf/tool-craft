'use client';

import { Alert, Button, Card, Input, InputNumber, Select, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { ALPHABET_PRESETS, QUICK_RADIXES, RADIX_PRESETS } from './constants';
import styles from './index.module.css';
import { CROCKFORD_ALPHABET, DEFAULT_ALPHABET, convertRadix, convertToCommonBases, groupDigits } from './utils/radix';

const { Text } = Typography;

/**
 * Base-N 任意进制整数互转器
 *
 * 基于 BigInt 的纯本地计算，支持 radix 2–36、0x/0o/0b 前缀识别、
 * 下划线分隔、负数、超大整数与自定义字母表（如 Crockford Base32）。
 */
export default function BaseNRadixConverter() {
  const [input, setInput] = useState('255');
  const [fromRadix, setFromRadix] = useState<number>(10);
  const [toRadix, setToRadix] = useState<number>(2);
  const [alphabetMode, setAlphabetMode] = useState<'standard' | 'crockford' | 'custom'>('standard');
  const [customAlphabet, setCustomAlphabet] = useState('');

  const alphabet = useMemo(() => {
    if (alphabetMode === 'crockford') {
      return CROCKFORD_ALPHABET;
    }
    if (alphabetMode === 'custom') {
      return customAlphabet.toLowerCase();
    }
    return DEFAULT_ALPHABET;
  }, [alphabetMode, customAlphabet]);

  const conversion = useMemo(() => {
    if (input.trim() === '') {
      return { ok: false as const, error: '请输入待转换的整数' };
    }
    if (alphabet.length < 2 || new Set(alphabet).size !== alphabet.length) {
      return { ok: false as const, error: '字母表非法：长度须 ≥2 且字符唯一' };
    }
    try {
      const result = convertRadix({
        input,
        fromRadix,
        toRadix,
        fromAlphabet: DEFAULT_ALPHABET,
        toAlphabet: alphabet,
      });
      return { ok: true as const, result };
    } catch (caught) {
      return { ok: false as const, error: caught instanceof Error ? caught.message : '转换失败' };
    }
  }, [input, fromRadix, toRadix, alphabet]);

  const commonBases = useMemo(() => {
    if (input.trim() === '') {
      return [];
    }
    try {
      return convertToCommonBases(input, fromRadix, DEFAULT_ALPHABET);
    } catch {
      return [];
    }
  }, [input, fromRadix]);

  const groupedOutput = conversion.ok
    ? groupDigits(conversion.result.output, toRadix === 2 ? 4 : toRadix === 10 ? 3 : 4)
    : '';

  const copyOutput = async () => {
    if (!conversion.ok) {
      return;
    }
    try {
      await navigator.clipboard.writeText(conversion.result.output);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择文本');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.presetRow}>
        {RADIX_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size="small"
            onClick={() => {
              setInput(preset.input);
              setFromRadix(preset.fromRadix);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Card size="small" title="输入与进制设置">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>待转换整数（支持 0x / 0o / 0b 前缀、下划线分隔、负号）</span>
            <Input
              placeholder="例如 255、0xFF、1111_0000、-1024"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              allowClear
            />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <span className={styles.label}>源进制（无前缀时生效）</span>
              <InputNumber min={2} max={36} value={fromRadix} onChange={(value) => setFromRadix(value ?? 10)} addonAfter="radix" />
              <div className={styles.quickRow}>
                {QUICK_RADIXES.map((item) => (
                  <Button key={item.value} size="small" type={fromRadix === item.value ? 'primary' : 'default'} onClick={() => setFromRadix(item.value)}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>目标进制</span>
              <InputNumber min={2} max={36} value={toRadix} onChange={(value) => setToRadix(value ?? 2)} addonAfter="radix" />
              <div className={styles.quickRow}>
                {QUICK_RADIXES.map((item) => (
                  <Button key={item.value} size="small" type={toRadix === item.value ? 'primary' : 'default'} onClick={() => setToRadix(item.value)}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>目标字母表</span>
            <Select
              value={alphabetMode}
              onChange={(value) => setAlphabetMode(value)}
              options={[
                { label: '标准 0-9a-z（radix 2–36）', value: 'standard' },
                { label: 'Crockford Base32（防混淆，radix 2–32）', value: 'crockford' },
                { label: '自定义字母表', value: 'custom' },
              ]}
            />
            {alphabetMode === 'custom' && (
              <>
                <Input
                  placeholder="输入 ≥2 个互不重复的字符作为字母表，下标 0 对应数值 0"
                  value={customAlphabet}
                  onChange={(event) => setCustomAlphabet(event.target.value)}
                />
                <span className={styles.hint}>
                  也可从预设填充：
                  {ALPHABET_PRESETS.map((preset) => (
                    <Button key={preset.label} size="small" type="link" onClick={() => setCustomAlphabet(preset.value)}>
                      {preset.label}
                    </Button>
                  ))}
                </span>
              </>
            )}
          </div>
        </Space>
      </Card>

      {conversion.ok ? (
        <div className={styles.resultBox}>
          <div className={styles.outputLine}>
            <div>
              <Tag color="blue">radix {toRadix} 结果{conversion.result.effectiveRadix !== fromRadix && `（前缀识别为 ${conversion.result.effectiveRadix} 进制）`}</Tag>
            </div>
            <Button size="small" onClick={copyOutput}>
              复制结果
            </Button>
          </div>
          <div className={styles.outputValue}>{conversion.result.output}</div>
          <div className={styles.grouped}>位视图：{groupedOutput}</div>
          <Text type="secondary">
            十进制中间值（BigInt，无精度损失）：{conversion.result.decimalValue.toString()}
          </Text>
        </div>
      ) : (
        <Alert type="error" showIcon message={conversion.error} />
      )}

      {commonBases.length > 0 && (
        <Card size="small" title="常用进制一览">
          <div className={styles.tableWrap}>
            <Table
              size="small"
              rowKey="radix"
              pagination={false}
              dataSource={commonBases}
              columns={[
                { title: '进制', dataIndex: 'label', key: 'label', width: 160 },
                {
                  title: '值',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value: string, row) => (
                    <Space direction="vertical" size={0}>
                      <Text code copyable={{ text: value }}>
                        {value}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {groupDigits(value, row.radix === 10 ? 3 : 4)}
                      </Text>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        message="全部转换基于原生 BigInt 在浏览器本地完成，支持超过 2^53 的任意大整数；本工具仅处理整数，浮点 / 小数进制转换不在范围内。"
      />
    </div>
  );
}
