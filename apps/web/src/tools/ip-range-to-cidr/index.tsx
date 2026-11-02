'use client';

import React from 'react';
import { Alert, Button, Card, Input, Segmented, Space, Statistic, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { formatAddressCount, splitLines } from './utils/format';
import {
  parseRangeToCidrs,
  summarizeCidrs,
  type CidrBlock,
} from './utils/ip';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'range' | 'summarize';

const DEFAULT_START = '192.168.1.5';
const DEFAULT_END = '192.168.1.19';
const DEFAULT_CIDR_LIST = '192.168.0.0/24\n192.168.1.0/24\n10.0.0.0/30\n10.0.0.4/30';

/**
 * IP 区间转最小 CIDR 列表工具
 *
 * 支持将 IPv4/IPv6 的起止地址区间聚合为数量最少的 CIDR 块，
 * 以及将一批 CIDR 合并为最小超网。全部基于 BigInt 在浏览器本地计算。
 *
 * @param props - 工具组件属性
 * @returns IP 区间聚合工具界面
 */
const IpRangeToCidr: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Mode>('range');

  return (
    <div className={styles.container}>
      <Segmented
        value={mode}
        onChange={(value) => setMode(value as Mode)}
        options={[
          { label: '区间 → CIDR 列表', value: 'range' },
          { label: 'CIDR 合并（超网）', value: 'summarize' },
        ]}
      />
      {mode === 'range' ? <RangePanel /> : <SummarizePanel />}
    </div>
  );
};

interface ResultState {
  blocks: CidrBlock[];
  error: string | null;
}

/** 区间聚合面板 */
const RangePanel: React.FC = () => {
  const [start, setStart] = React.useState(DEFAULT_START);
  const [end, setEnd] = React.useState(DEFAULT_END);

  const result: ResultState = React.useMemo(() => {
    if (start.trim().length === 0 || end.trim().length === 0) {
      return { blocks: [], error: null };
    }
    try {
      return { blocks: parseRangeToCidrs(start, end), error: null };
    } catch (error) {
      return { blocks: [], error: error instanceof Error ? error.message : String(error) };
    }
  }, [start, end]);

  const outputText = result.blocks.map((block) => block.text).join('\n');
  const totalAddresses = result.blocks.reduce((sum, block) => sum + block.size, BigInt(0));

  const handleCopy = async () => {
    if (outputText.length === 0) {
      return;
    }
    await copyToClipboard(outputText);
    message.success(`已复制 ${result.blocks.length} 个 CIDR`);
  };

  return (
    <div className={styles.layout}>
      <Card title="起止 IP 地址" size="small">
        <div className={styles.inputColumn}>
          <label>
            起始地址（IPv4 或 IPv6）
            <Input
              value={start}
              onChange={(event) => setStart(event.target.value)}
              placeholder="192.168.1.5 或 2001:db8::1"
            />
          </label>
          <label>
            结束地址（需与起始同协议版本）
            <Input
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              placeholder="192.168.1.19 或 2001:db8::100"
            />
          </label>
          {result.error && <Alert type="error" showIcon message={result.error} />}
          <Alert
            type="info"
            showIcon
            message="算法说明"
            description="从起始地址贪心取「对齐且不越过结束地址」的最大 CIDR 块，得到的块数在数学上最少，且各块不重叠、并集恰好覆盖整个区间。"
          />
        </div>
      </Card>

      <Card
        title={
          <Space>
            最小 CIDR 列表
            {result.blocks.length > 0 && <Tag color="green">IPv{result.blocks[0]?.version}</Tag>}
          </Space>
        }
        size="small"
        extra={
          <Button icon={<CopyOutlined />} disabled={result.blocks.length === 0} onClick={handleCopy}>
            复制全部
          </Button>
        }
      >
        {result.blocks.length > 0 && (
          <>
            <div className={styles.summaryRow}>
              <Statistic title="CIDR 块数" value={result.blocks.length} />
              <Statistic title="覆盖地址总数" value={formatAddressCount(totalAddresses)} />
              <Statistic
                title="最大块"
                value={result.blocks.reduce((max, block) => (block.size > max.size ? block : max)).text}
              />
            </div>
            <div className={styles.cidrList} style={{ marginTop: 12 }}>
              {result.blocks.map((block) => (
                <div key={block.text} className={styles.cidrItem}>
                  <span>{block.text}</span>
                  <Tag>{formatAddressCount(block.size)} 个地址</Tag>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

/** CIDR 合并面板 */
const SummarizePanel: React.FC = () => {
  const [input, setInput] = React.useState(DEFAULT_CIDR_LIST);

  const result: ResultState = React.useMemo(() => {
    const entries = splitLines(input);
    if (entries.length === 0) {
      return { blocks: [], error: null };
    }
    try {
      return { blocks: summarizeCidrs(entries), error: null };
    } catch (error) {
      return { blocks: [], error: error instanceof Error ? error.message : String(error) };
    }
  }, [input]);

  const outputText = result.blocks.map((block) => block.text).join('\n');

  const handleCopy = async () => {
    if (outputText.length === 0) {
      return;
    }
    await copyToClipboard(outputText);
    message.success(`已复制 ${result.blocks.length} 个 CIDR`);
  };

  return (
    <div className={styles.layout}>
      <Card title="待合并的 CIDR（每行一个，也支持空格/逗号分隔）" size="small">
        <Input.TextArea
          className={styles.plainTextarea}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          autoSize={{ minRows: 10, maxRows: 20 }}
          spellCheck={false}
        />
        {result.error && (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message={result.error} />
        )}
      </Card>

      <Card
        title="合并结果（最小超网）"
        size="small"
        extra={
          <Button icon={<CopyOutlined />} disabled={result.blocks.length === 0} onClick={handleCopy}>
            复制全部
          </Button>
        }
      >
        {result.blocks.length > 0 && (
          <>
            <div className={styles.summaryRow}>
              <Statistic title="输入条数" value={splitLines(input).length} />
              <Statistic title="合并后块数" value={result.blocks.length} />
              <Statistic
                title="协议"
                value={`IPv${result.blocks[0]?.version}`}
              />
            </div>
            <div className={styles.cidrList} style={{ marginTop: 12 }}>
              {result.blocks.map((block) => (
                <div key={block.text} className={styles.cidrItem}>
                  <span>{block.text}</span>
                  <Tag>{formatAddressCount(block.size)} 个地址</Tag>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default IpRangeToCidr;
