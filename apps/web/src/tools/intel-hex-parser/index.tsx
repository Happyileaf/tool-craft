'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Table, Tag, message } from 'antd';
import { CopyOutlined, ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  fixChecksums,
  parseIntelHex,
  toHexAddress,
  toHexByte,
  toHexWord,
  type HexRecord,
} from './utils/intelHex';
import styles from './index.module.css';

/** 内置示例：含 type 04 扩展线性地址、type 00 数据、type 01 EOF，其中一行校验和被故意破坏 */
const SAMPLE_HEX = [
  ':020000040000FA',
  ':10010000214601360121470136007EFE09D2190140',
  ':10011000214601360121470136007EFE09D2190130',
  ':10012000214601360121470136007EFE09D2190141',
  ':00000001FF',
].join('\n');

/**
 * Intel HEX 解析与校验和工具：
 * 本地解析 I8HEX / HEX-32 / HEX-86 记录，校验每行校验和、跟踪基址计算绝对地址，
 * 并支持一键重算全部校验和后复制修正文本。
 *
 * @returns Intel HEX 解析与修复界面
 */
const IntelHexParser: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState<string>(SAMPLE_HEX);

  const result = React.useMemo(() => parseIntelHex(input), [input]);
  const fixedText = React.useMemo(() => fixChecksums(input), [input]);

  const loadSample = (): void => {
    setInput(SAMPLE_HEX);
    message.success('已载入示例 HEX（含一条校验和错误行）');
  };

  const handleFixAll = (): void => {
    const originalLines = input.split(/\r?\n/);
    const fixedLines = fixedText.split('\n');
    const changedCount = originalLines.filter((line, index) => {
      const candidate = fixedLines[index] ?? '';
      return line.trim() !== '' && line.trim() !== candidate;
    }).length;
    if (changedCount === 0) {
      message.info('所有结构合法记录行的校验和均已正确');
      return;
    }
    setInput(fixedText);
    message.success(`已修复 ${changedCount} 行校验和`);
  };

  const handleCopy = async (): Promise<void> => {
    if (fixedText.trim() === '') {
      message.warning('暂无可复制的 HEX 内容');
      return;
    }
    await copyToClipboard(fixedText);
    message.success('修正后的 HEX 文本已复制');
  };

  const { summary } = result;
  const rangeText =
    summary.minAddress === null || summary.maxAddress === null
      ? '—'
      : `${toHexAddress(summary.minAddress)} ~ ${toHexAddress(summary.maxAddress)}`;

  return (
    <div className={styles.container}>
      <Card
        title="Intel HEX 输入"
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={loadSample}>
              载入示例
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<ToolOutlined />}
              onClick={handleFixAll}
            >
              一键修复全部校验和
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          value={input}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 8, maxRows: 18 }}
          placeholder="粘贴 Intel HEX 文本，每行一条 :LLAAAATT[DD...]CC 记录…"
        />
        <p className={styles.hint}>
          全部解析与校验和运算均在浏览器本地完成，不发起任何网络请求；畸形行会跳过并在下方列出，不中断后续解析。
        </p>
      </Card>

      {result.summary.totalLines === 0 ? (
        <Empty description="粘贴 HEX 记录后在此显示解析结果" />
      ) : (
        <>
          <div className={styles.statsGrid}>
            <Card>
              <Statistic title="总行数" value={summary.totalLines} />
            </Card>
            <Card>
              <Statistic title="数据字节总数" value={summary.totalDataBytes} />
            </Card>
            <Card>
              <Statistic title="绝对地址范围" value={rangeText} />
            </Card>
            <Card>
              <Statistic
                title="错误数"
                value={result.errors.length}
                valueStyle={result.errors.length > 0 ? { color: '#cf1322' } : undefined}
              />
            </Card>
          </div>

          <Card size="small" title="记录类型分布">
            <Space wrap>
              {Object.entries(summary.typeDistribution).map(([typeKey, count]) => (
                <Tag key={typeKey} color="blue">
                  0x{typeKey} × {count}
                </Tag>
              ))}
              <Tag color={summary.eofAtEnd ? 'success' : 'warning'}>
                EOF {summary.eofAtEnd ? '唯一且位于末尾' : `异常（${summary.eofCount} 条）`}
              </Tag>
            </Space>
          </Card>

          {result.warnings.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="结构警告"
              description={
                <ul className={styles.alertList}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              }
            />
          ) : null}

          {result.errors.length > 0 ? (
            <Alert
              type="error"
              showIcon
              message={`错误列表（${result.errors.length} 条）`}
              description={
                <ul className={styles.alertList}>
                  {result.errors.map((error) => (
                    <li key={`${error.lineNumber}-${error.reason}`}>
                      <span className={styles.mono}>{error.raw}</span>
                      <div>{error.reason}</div>
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}

          <Card size="small" title="记录明细">
            <Table<HexRecord>
              size="small"
              rowKey="lineNumber"
              dataSource={result.records}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 760 }}
              columns={[
                {
                  title: '行号',
                  dataIndex: 'lineNumber',
                  width: 72,
                },
                {
                  title: '类型',
                  dataIndex: 'typeName',
                  width: 150,
                  render: (_: unknown, record: HexRecord) => (
                    <span>
                      {record.typeName}
                      <Tag className={styles.typeTag}>0x{toHexByte(record.type)}</Tag>
                    </span>
                  ),
                },
                {
                  title: '行内地址',
                  dataIndex: 'address',
                  width: 110,
                  render: (_: unknown, record: HexRecord) => (
                    <span className={styles.mono}>{toHexWord(record.address)}</span>
                  ),
                },
                {
                  title: '绝对地址',
                  dataIndex: 'absoluteAddress',
                  width: 130,
                  render: (_: unknown, record: HexRecord) => (
                    <span className={styles.mono}>
                      {record.absoluteAddress === null
                        ? '—'
                        : toHexAddress(record.absoluteAddress)}
                    </span>
                  ),
                },
                {
                  title: '字节数',
                  dataIndex: 'byteCount',
                  width: 80,
                },
                {
                  title: '校验和',
                  dataIndex: 'checksumStatus',
                  render: (_: unknown, record: HexRecord) =>
                    record.checksumStatus === 'valid' ? (
                      <Tag color="success">有效 0x{toHexByte(record.checksum)}</Tag>
                    ) : (
                      <Tag color="error">
                        无效 0x{toHexByte(record.checksum)}（应为 0x
                        {toHexByte(record.expectedChecksum)}）
                      </Tag>
                    ),
                },
              ]}
            />
          </Card>

          <Card
            title="修复后的 HEX 输出"
            extra={
              <Button type="primary" size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
            }
          >
            <pre className={styles.output}>{fixedText}</pre>
          </Card>
        </>
      )}
    </div>
  );
};

export default IntelHexParser;
