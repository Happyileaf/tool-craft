'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Segmented, Space, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  decodeBlock,
  decodeStream,
  encodeBlock,
  encodeStream,
  flipBits,
  randomPositions,
  type HammingBlock,
} from './utils/hamming';
import { DATA_LABEL, DEFAULT_BATCH, DEFAULT_DATA, FLIP_OPTIONS, PARITY_LABEL, STATUS_META } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const { TextArea } = Input;

/** 渲染 7 位码字，按位置标注 P/D，出错位高亮。 */
const CodewordBits: React.FC<{ codeword: string; errorPosition?: number }> = ({ codeword, errorPosition = 0 }) => (
  <div className={styles.bitRow}>
    {codeword.split('').map((bit, idx) => {
      const pos = idx + 1;
      const isParity = pos in PARITY_LABEL;
      const isError = pos === errorPosition;
      return (
        <div key={pos} className={styles.bitCell}>
          <span className={styles.bitIndex}>{pos}</span>
          <span
            className={`${styles.bitBox} ${isParity ? styles.bitParity : ''} ${isError ? styles.bitError : ''}`}
          >
            {bit}
          </span>
          <span className={`${styles.bitLabel} ${isParity ? styles.parityLabel : styles.dataLabel}`}>
            {isParity ? PARITY_LABEL[pos] : DATA_LABEL[pos]}
          </span>
        </div>
      );
    })}
  </div>
);

/** 单组编解码 + 信道错误注入演示。 */
const SingleBlockDemo: React.FC = () => {
  const [data, setData] = React.useState(DEFAULT_DATA);
  const [flipCount, setFlipCount] = React.useState<number>(0);
  const [flipped, setFlipped] = React.useState<number[]>([]);

  const dataError = React.useMemo(() => {
    const cleaned = data.replace(/\s+/g, '');
    if (cleaned.length === 0) return '请输入 4 位数据';
    if (!/^[01]{4}$/.test(cleaned)) return '必须是恰好 4 位 0/1';
    return '';
  }, [data]);

  const encoded = React.useMemo(() => (dataError ? '' : encodeBlock(data.replace(/\s+/g, ''))), [data, dataError]);

  const corrupted = React.useMemo(() => {
    if (!encoded) return '';
    return flipped.length ? flipBits(encoded, flipped) : encoded;
  }, [encoded, flipped]);

  const decoded: HammingBlock | null = React.useMemo(() => {
    if (!corrupted) return null;
    const block = decodeBlock(corrupted);
    if (flipCount >= 2) block.status = 'double-error';
    return block;
  }, [corrupted, flipCount]);

  const inject = (n: number) => {
    setFlipCount(n);
    setFlipped(n === 0 ? [] : randomPositions(n));
  };

  const handleReshuffle = () => {
    if (flipCount > 0) setFlipped(randomPositions(flipCount));
  };

  return (
    <div className={styles.container}>
      {dataError && <Alert type="error" showIcon message={dataError} />}
      <Card size="small" title="① 输入 4 位数据">
        <Input
          value={data}
          maxLength={4}
          placeholder="例如 1011"
          onChange={(e) => {
            setData(e.target.value.replace(/[^01]/g, '').slice(0, 4));
            setFlipped([]);
            setFlipCount(0);
          }}
        />
      </Card>

      <Card size="small" title="② Hamming(7,4) 编码（蓝色为偶校验位 P1/P2/P4）">
        {encoded && <CodewordBits codeword={encoded} />}
      </Card>

      <Card size="small" title="③ 信道传输 · 错误注入">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Segmented options={FLIP_OPTIONS.map((o) => ({ label: o.label, value: o.value }))} value={flipCount} onChange={(v) => inject(Number(v))} />
          <Button size="small" icon={<ThunderboltOutlined />} onClick={handleReshuffle} disabled={flipCount === 0}>
            随机重新注入
          </Button>
          {corrupted && (
            <div>
              <div className={styles.resultLabel}>接收端收到的码字{flipped.length ? `（翻转位置：${flipped.join(', ')}）` : ''}</div>
              <CodewordBits codeword={corrupted} errorPosition={decoded?.status === 'corrected' ? decoded.errorPosition : 0} />
            </div>
          )}
        </Space>
      </Card>

      {decoded && (
        <Card size="small" title="④ 接收端解码（校正子 syndrome 定位）">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>校正子（P4 P2 P1）</span>
                <span className={styles.resultValue}>{decoded.syndrome.toString(2).padStart(3, '0')} = {decoded.syndrome}</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>错误位号</span>
                <span className={styles.resultValue}>{decoded.errorPosition === 0 ? '无' : `第 ${decoded.errorPosition} 位`}</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>还原数据</span>
                <span className={`${styles.resultValue} ${styles.mono}`}>{decoded.data}</span>
              </div>
            </div>
            <Tag color={STATUS_META[decoded.status]?.color ?? 'default'}>{STATUS_META[decoded.status]?.label ?? decoded.status}</Tag>
            {decoded.status === 'double-error' && (
              <Alert type="error" showIcon message="双比特错误：校正子非零但定位会指向错误位置，标准 Hamming(7,4) 只能检出双错而无法纠正。" />
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

/** 批量编解码 Tab。 */
const BatchCodec: React.FC = () => {
  const [mode, setMode] = React.useState<'encode' | 'decode'>('encode');
  const [input, setInput] = React.useState(DEFAULT_BATCH);

  type BatchResult = { codeword: string; data: string; padded: number; blocks: HammingBlock[] };

  const parsed = React.useMemo<{ result: BatchResult | null; error: string }>(() => {
    if (input.trim() === '') return { result: null, error: '' };
    try {
      if (mode === 'encode') {
        const encoded = encodeStream(input);
        return { result: { ...encoded, data: '', blocks: [] }, error: '' };
      }
      const decoded = decodeStream(input);
      return { result: { ...decoded, codeword: '', padded: 0 }, error: '' };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : '输入无效' };
    }
  }, [input, mode]);

  const { result, error } = parsed;

  const outputText = React.useMemo(() => {
    if (!result) return '';
    return mode === 'encode' ? result.codeword : result.data;
  }, [result, mode]);

  const handleCopy = () => {
    if (!outputText) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(outputText);
    message.success('已复制结果');
  };

  const columns = [
    { title: '组号', dataIndex: 'index', key: 'index', width: 70, render: (v: number) => v + 1 },
    { title: '码字（7 位）', dataIndex: 'codeword', key: 'codeword', render: (v: string) => <span className={styles.mono}>{v}</span> },
    { title: '校正子', dataIndex: 'syndrome', key: 'syndrome', render: (v: number) => v },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={STATUS_META[v]?.color ?? 'default'}>{STATUS_META[v]?.label ?? v}</Tag>,
    },
    { title: '数据（4 位）', dataIndex: 'data', key: 'data', render: (v: string) => <span className={styles.mono}>{v}</span> },
  ];

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(e) => {
          setMode(e.target.value);
          setInput(e.target.value === 'encode' ? DEFAULT_BATCH : '0110011 1100110');
        }}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="encode">编码（比特流 → 码字流）</Radio.Button>
        <Radio.Button value="decode">解码（码字流 → 数据）</Radio.Button>
      </Radio.Group>

      <TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? '任意 0/1 比特流，自动按 4 位分组' : '7 位倍数的码字流，空格分隔'} />
      {error && <Alert type="error" showIcon message={error} />}

      {result && mode === 'encode' && result.padded > 0 && (
        <Alert type="info" showIcon message={`最后一组不足 4 位，已在右侧补 ${result.padded} 个 0`} />
      )}

      {result && (
        <Card
          size="small"
          title="输出"
          extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>}
        >
          <Alert className={styles.mono} type="success" showIcon message={outputText} />
          {mode === 'decode' && (
            <Table
              style={{ marginTop: 12 }}
              rowKey="index"
              size="small"
              pagination={false}
              columns={columns}
              dataSource={result.blocks.map((b, i) => ({ ...b, index: i }))}
            />
          )}
        </Card>
      )}
    </div>
  );
};

const HammingCodec: React.FC<ToolComponentProps> = () => (
  <Tabs
    items={[
      { key: 'single', label: '单组演示', children: <SingleBlockDemo /> },
      { key: 'batch', label: '批量编解码', children: <BatchCodec /> },
    ]}
  />
);

export default HammingCodec;
