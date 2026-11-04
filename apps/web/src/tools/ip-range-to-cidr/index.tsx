'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message, type RadioChangeEvent } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  DEFAULT_CIDR_INPUT,
  DEFAULT_RANGE_INPUT,
  MERGE_SAMPLES,
  MODE_OPTIONS,
  RANGE_SAMPLES,
  type AggregateMode,
} from './constants';
import {
  formatCidr,
  formatIp,
  mergeCidrs,
  parseCidrs,
  parseRanges,
  rangeToCidrs,
  totalAddresses,
  type CidrBlock,
} from './utils/rangeCidr';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 表格行数据 */
interface ResultRow {
  /** 行唯一键 */
  key: string;
  /** CIDR 文本 */
  cidr: string;
  /** 起始地址 */
  start: string;
  /** 结束地址 */
  end: string;
  /** 块内地址数 */
  count: string;
  /** 地址族 */
  family: 4 | 6;
}

/** 组件计算状态 */
interface ComputedState {
  /** 结果行 */
  rows: ResultRow[];
  /** CIDR 块总数 */
  blockCount: number;
  /** 覆盖地址总数 */
  addressCount: string;
  /** 错误信息 */
  error: string | null;
}

/** 空状态 */
const EMPTY_STATE: ComputedState = { rows: [], blockCount: 0, addressCount: '0', error: null };

/**
 * 把 CIDR 块列表转换为表格行
 *
 * @param blocks - CIDR 块
 * @returns 表格行
 */
function toRows(blocks: CidrBlock[]): ResultRow[] {
  return blocks.map((block, index) => ({
    key: `${formatCidr(block)}-${index}`,
    cidr: formatCidr(block),
    start: formatIp(block.start, block.family),
    end: formatIp(block.end, block.family),
    count: (block.end - block.start + BigInt(1)).toString(),
    family: block.family,
  }));
}

const RESULT_COLUMNS: ColumnsType<ResultRow> = [
  {
    title: 'CIDR',
    dataIndex: 'cidr',
    key: 'cidr',
    render: (value: string, row) => (
      <Space>
        <span className={styles.cidrText}>{value}</span>
        <Tag color={row.family === 4 ? 'blue' : 'geekblue'}>IPv{row.family}</Tag>
      </Space>
    ),
  },
  { title: '起始地址', dataIndex: 'start', key: 'start' },
  { title: '结束地址', dataIndex: 'end', key: 'end' },
  { title: '地址数', dataIndex: 'count', key: 'count', align: 'right' },
];

/**
 * IP 范围 → 最小 CIDR 聚合 / CIDR 超网合并工具
 *
 * 范围模式把每行「起始 IP - 结束 IP」聚合为数量最少的 CIDR 前缀；
 * 合并模式把一组可能重叠或相邻的 CIDR 去重合并为最小超网列表。
 * 全部基于 BigInt 在浏览器本地运算，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @returns 聚合 / 合并交互界面
 */
const IpRangeToCidr: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<AggregateMode>('range-to-cidr');
  const [rangeInput, setRangeInput] = React.useState<string>(defaultInput || DEFAULT_RANGE_INPUT);
  const [cidrInput, setCidrInput] = React.useState<string>(DEFAULT_CIDR_INPUT);
  const [state, setState] = React.useState<ComputedState>(EMPTY_STATE);

  const input = mode === 'range-to-cidr' ? rangeInput : cidrInput;

  React.useEffect(() => {
    const text = input.trim();
    if (text === '') {
      setState({ ...EMPTY_STATE, error: '请输入至少一行内容' });
      return;
    }
    try {
      const blocks =
        mode === 'range-to-cidr'
          ? parseRanges(text).flatMap((range) => rangeToCidrs(range))
          : mergeCidrs(parseCidrs(text));
      setState({
        rows: toRows(blocks),
        blockCount: blocks.length,
        addressCount: totalAddresses(blocks).toString(),
        error: null,
      });
    } catch (caught) {
      setState({ ...EMPTY_STATE, error: caught instanceof Error ? caught.message : '计算失败' });
    }
  }, [input, mode]);

  /**
   * 复制当前全部 CIDR 结果（每行一个）
   */
  const handleCopy = async () => {
    if (state.error || state.rows.length === 0) {
      message.warning('请先修正输入后再复制');
      return;
    }
    await copyToClipboard(state.rows.map((row) => row.cidr).join('\n'));
    message.success('复制成功');
  };

  const samples = mode === 'range-to-cidr' ? RANGE_SAMPLES : MERGE_SAMPLES;
  const placeholder =
    mode === 'range-to-cidr'
      ? '每行一个 IP 范围，例如 192.168.1.0 - 192.168.1.30（支持 IPv4 / IPv6，短横线或空格分隔）'
      : '每行一个 CIDR，例如 192.168.0.0/24（支持 IPv4 / IPv6，自动去重与超网合并）';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          {samples.map((sample) => (
            <Button
              key={sample.value}
              size="small"
              onClick={() => (mode === 'range-to-cidr' ? setRangeInput(sample.value) : setCidrInput(sample.value))}
            >
              {sample.label}
            </Button>
          ))}
        </Space>
        <Space wrap>
          <Radio.Group
            value={mode}
            onChange={(event: RadioChangeEvent) => setMode(event.target.value as AggregateMode)}
            optionType="button"
            buttonStyle="solid"
            options={MODE_OPTIONS}
          />
          <Button
            icon={<ClearOutlined />}
            onClick={() => (mode === 'range-to-cidr' ? setRangeInput('') : setCidrInput(''))}
          >
            清空
          </Button>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制 CIDR
          </Button>
        </Space>
      </div>

      <div className={styles.inputArea}>
        <Input.TextArea
          value={input}
          onChange={(event) =>
            mode === 'range-to-cidr' ? setRangeInput(event.target.value) : setCidrInput(event.target.value)
          }
          placeholder={placeholder}
          autoSize={{ minRows: 4, maxRows: 12 }}
          allowClear
        />
      </div>

      {state.error ? (
        <Alert type="error" showIcon message="输入非法" description={state.error} />
      ) : (
        <Card
          title={mode === 'range-to-cidr' ? '最小 CIDR 聚合结果' : '超网合并结果'}
          className={styles.resultCard}
        >
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>CIDR 块数</span>
              <span className={styles.summaryValue}>{state.blockCount}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>覆盖地址总数</span>
              <span className={styles.summaryValue}>{state.addressCount}</span>
            </div>
          </div>
          <Table<ResultRow>
            columns={RESULT_COLUMNS}
            dataSource={state.rows}
            pagination={state.rows.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
};

export default IpRangeToCidr;
