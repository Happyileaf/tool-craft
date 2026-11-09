'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, List, Radio, Space, Statistic, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  analyzeTable,
  analyzeText,
  decodeBits,
  displaySymbol,
  type CodeEntry,
  type InputMode,
} from './utils/huffman';
import { DEFAULT_INPUT, DEFAULT_TABLE, METRIC_PRECISION, MODE_OPTIONS, SAMPLE_TEXTS, TABLE_PAGE_SIZE } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface CodeRow extends CodeEntry {
  key: string;
  ratio: number;
}

const HuffmanCodingVisualizer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<InputMode>('text');
  const [textInput, setTextInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [tableInput, setTableInput] = React.useState(DEFAULT_TABLE);

  const result = React.useMemo(
    () => (mode === 'text' ? analyzeText(textInput) : analyzeTable(tableInput)),
    [mode, textInput, tableInput],
  );

  const decoded = React.useMemo(() => {
    if (result.error || !result.root) {
      return null;
    }
    return decodeBits(result.encodedBits, result.root);
  }, [result]);

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  const handleCopy = (content: string, label: string) => {
    if (content === '') {
      message.error('暂无可复制的内容');
      return;
    }
    void copyToClipboard(content);
    message.success(`已复制${label}`);
  };

  const codeRows: CodeRow[] = result.codes.map((entry) => ({
    ...entry,
    key: entry.symbol,
    ratio: result.totalWeight > 0 ? entry.weight / result.totalWeight : 0,
  }));

  const codeColumns: ColumnsType<CodeRow> = [
    {
      title: '符号',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 110,
      render: (symbol: string) => <Tag color="blue">{displaySymbol(symbol)}</Tag>,
    },
    { title: '频次', dataIndex: 'weight', key: 'weight', width: 90 },
    {
      title: '码字（前缀码）',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <span className={styles.mono}>{code}</span>,
    },
    { title: '码长', dataIndex: 'codeLength', key: 'codeLength', width: 90 },
    {
      title: '频次占比',
      dataIndex: 'ratio',
      key: 'ratio',
      width: 120,
      render: (ratio: number) => `${(ratio * 100).toFixed(2)}%`,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="输入"
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={mode}
              options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(e) => setMode(e.target.value as InputMode)}
            />
          }
        >
          {mode === 'text' ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input.TextArea
                value={textInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                autoSize={{ minRows: 10, maxRows: 20 }}
                placeholder="输入任意文本，工具自动统计字符频次并构建哈夫曼树…"
              />
              <Space wrap size={[8, 8]}>
                {SAMPLE_TEXTS.map((sample) => (
                  <Button key={sample.label} size="small" onClick={() => setTextInput(sample.text)}>
                    {sample.label}
                  </Button>
                ))}
                <Button size="small" onClick={() => setTextInput('')}>
                  清空
                </Button>
              </Space>
            </Space>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input.TextArea
                value={tableInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTableInput(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                autoSize={{ minRows: 10, maxRows: 20 }}
                placeholder={'每行一条「符号,频次」，例如：\nA,5\nB,3'}
              />
              <Space wrap size={[8, 8]}>
                <Button size="small" onClick={() => setTableInput(DEFAULT_TABLE)}>
                  填入示例
                </Button>
                <Button size="small" onClick={() => setTableInput('')}>
                  清空
                </Button>
              </Space>
            </Space>
          )}
        </Card>

        <Card
          className={styles.card}
          title="编码比特串"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(result.encodedBits, '编码比特串')}
            >
              复制比特串
            </Button>
          }
        >
          {result.error ? (
            <Alert type="error" showIcon message={result.error} />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className={styles.bitString}>{result.encodedBits}</div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>十六进制（8 位对齐）：</span>
                <span className={styles.hexText}>{result.hex?.hex}</span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(result.hex?.hex ?? '', '十六进制结果')}
                >
                  复制
                </Button>
              </div>
              <div className={styles.hint}>
                比特串共 {result.totalBits} 位，末尾补 {result.hex?.paddingBits ?? 0} 个 0
                对齐到字节边界；填充位仅用于对齐，不属于有效编码。
              </div>
              {decoded && (
                <div className={styles.resultRow}>
                  <span className={styles.resultLabel}>按树解码还原：</span>
                  <Tag color={decoded.error ? 'warning' : 'green'} style={{ whiteSpace: 'normal' }}>
                    {mode === 'text' ? decoded.text : `（按频次展开）${decoded.text}`}
                  </Tag>
                </div>
              )}
              {decoded?.error && <Alert type="warning" showIcon message={decoded.error} />}
            </Space>
          )}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Tag color="blue">{activeMode?.label}</Tag>
        <span className={styles.hint}>
          {activeMode?.hint}；同权重按符号插入序 tie-break，左子树边为 0、右子树边为 1
        </span>
      </div>

      {!result.error && (
        <>
          <div className={styles.statsGrid}>
            <Card size="small">
              <Statistic title="符号种数" value={result.symbolCount} />
            </Card>
            <Card size="small">
              <Statistic title="总频次" value={result.totalWeight} />
            </Card>
            <Card size="small">
              <Statistic title="WPL（加权路径长度）" value={result.wpl} />
            </Card>
            <Card size="small">
              <Statistic
                title="平均码长（bits/符号）"
                value={result.averageCodeLength}
                precision={METRIC_PRECISION}
              />
            </Card>
            <Card size="small">
              <Statistic title="等长编码码长 ⌈log₂k⌉" value={result.fixedCodeLength} />
            </Card>
            <Card size="small">
              <Statistic
                title="相对等长编码节省"
                value={result.savingRatio * 100}
                precision={2}
                suffix="%"
              />
            </Card>
          </div>

          <Card size="small" title={`前缀码表（${result.codes.length} 个符号）`}>
            <Table<CodeRow>
              rowKey="key"
              size="small"
              columns={codeColumns}
              dataSource={codeRows}
              pagination={codeRows.length > TABLE_PAGE_SIZE ? { pageSize: TABLE_PAGE_SIZE, showSizeChanger: false } : false}
            />
          </Card>

          <Card
            size="small"
            title={`贪心合并过程（共 ${result.steps.length} 轮）`}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.steps.map((s) => s.description).join('\n'), '合并步骤')}>复制步骤</Button>}
          >
            {result.steps.length === 0 ? (
              <Empty description="仅一个符号，无需合并；码字约定为 0" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                bordered
                dataSource={result.steps}
                renderItem={(step) => (
                  <List.Item>
                    <Space>
                      <Tag color="purple">第 {step.round} 轮</Tag>
                      <span className={styles.mono}>{step.description}</span>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            size="small"
            title="哈夫曼树（缩进视图）"
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.treeText, '树形文本')}>复制树文本</Button>}
          >
            <div className={styles.treeWrap}>
              {result.treeLines.map((line, index) => (
                <div
                  key={`${line.label}-${index}`}
                  className={styles.treeLine}
                  style={{ paddingLeft: line.depth * 24 }}
                >
                  {line.edge === null ? (
                    <span className={`${styles.edgeTag} ${styles.edge0}`}>根</span>
                  ) : (
                    <span className={`${styles.edgeTag} ${line.edge === '0' ? styles.edge0 : styles.edge1}`}>
                      {line.edge}
                    </span>
                  )}
                  <span className={line.leaf ? styles.treeLeaf : styles.treeInternal}>{line.label}</span>
                  <span className={styles.weightTag}>权重 {line.weight}</span>
                  {line.leaf && <Tag color="green" style={{ marginInlineStart: 4 }}>叶子</Tag>}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default HuffmanCodingVisualizer;
