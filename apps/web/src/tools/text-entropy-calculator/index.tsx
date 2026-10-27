'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Empty, Input, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { analyzeEntropy, type CharFrequency } from './utils/entropy';
import { DEFAULT_TEXT, ENTROPY_PRECISION, RANDOM_TOKEN_SAMPLE, TABLE_PAGE_SIZE } from './constants';
import styles from './index.module.css';

/**
 * 将空白 / 控制字符转换为可读标签文本。
 *
 * @param char - 原始字符
 * @returns 用于表格展示的文本
 */
function displayChar(char: string): string {
  switch (char) {
    case ' ':
      return '空格';
    case '\t':
      return '制表符';
    case '\n':
      return '换行';
    case '\r':
      return '回车';
    default:
      return char;
  }
}

const columns: ColumnsType<CharFrequency> = [
  {
    title: '字符',
    dataIndex: 'char',
    key: 'char',
    width: 100,
    render: (char: string) => <Tag className={styles.charTag}>{displayChar(char)}</Tag>,
  },
  {
    title: '次数',
    dataIndex: 'count',
    key: 'count',
    width: 90,
  },
  {
    title: '概率',
    dataIndex: 'probability',
    key: 'probability',
    width: 110,
    render: (probability: number) => `${(probability * 100).toFixed(2)}%`,
  },
  {
    title: '分布',
    key: 'bar',
    render: (_, record) => (
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${record.probability * 100}%` }} />
      </div>
    ),
  },
];

/**
 * 文本信息熵计算器，基于 Shannon 熵 H = -Σ p·log2(p) 评估文本随机性，
 * 输出长度、唯一字符数、信息熵、归一化熵、理论最小编码位数及字符频率分布，
 * 全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 文本信息熵分析界面
 */
const TextEntropyCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState(defaultInput || DEFAULT_TEXT);

  const result = React.useMemo(() => analyzeEntropy(text), [text]);

  const statsItems = [
    { title: '字符总数', value: result.length },
    { title: '唯一字符', value: result.uniqueCount },
    {
      title: '信息熵（bits/字符）',
      value: result.entropy,
      precision: ENTROPY_PRECISION,
    },
    {
      title: '最大熵（bits/字符）',
      value: result.maxEntropy,
      precision: ENTROPY_PRECISION,
    },
    {
      title: '归一化熵',
      value: result.normalizedEntropy,
      precision: ENTROPY_PRECISION,
      suffix: '/ 1',
    },
    { title: '最小编码位数（bits）', value: result.minBits },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="输入文本"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => setText(RANDOM_TOKEN_SAMPLE)}>
              随机令牌示例
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => setText(DEFAULT_TEXT)}>
              普通示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setText('')}>
              清空
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="输入或粘贴待分析文本（密码、令牌、文章等）..."
          autoSize={{ minRows: 6, maxRows: 16 }}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <div className={styles.statsGrid}>
        {statsItems.map((item) => (
          <Card key={item.title}>
            <Statistic
              title={item.title}
              value={item.value}
              precision={item.precision ?? 0}
              suffix={item.suffix}
            />
          </Card>
        ))}
      </div>

      <Card title={`字符频率分布（${result.uniqueCount} 种字符）`}>
        {result.length === 0 ? (
          <Empty description="输入文本后展示字符频率分布" />
        ) : (
          <Table<CharFrequency>
            rowKey="char"
            columns={columns}
            dataSource={result.frequencies}
            size="small"
            pagination={{ pageSize: TABLE_PAGE_SIZE, showSizeChanger: false }}
          />
        )}
      </Card>

      <div className={styles.hint}>
        Shannon 信息熵 H = -Σ p·log2(p)，表示每个字符平均携带的信息量（bit）；熵越接近
        log2(唯一字符数) 说明字符分布越均匀、随机性越强、越难压缩，可用于评估密钥 / 令牌的随机程度。
        所有计算均在本地浏览器完成，文本不会上传。
      </div>
    </div>
  );
};

export default TextEntropyCalculator;
