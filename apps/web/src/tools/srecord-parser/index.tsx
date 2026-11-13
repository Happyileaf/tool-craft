'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Table, Tag, message } from 'antd';
import { CopyOutlined, ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { SAMPLE_SRECORD } from './constants';
import {
  decodeAscii,
  fixChecksums,
  parseSrecord,
  toHexAddress,
  toHexByte,
  type SrecordRecord,
} from './utils/srecord';
import styles from './index.module.css';

/** 数据预览单条记录展示的最大字节数，超出追加省略号 */
const PREVIEW_LIMIT = 16;

/** 将字节数组格式化为大写 hex 字符串，超过上限截断并加省略号 */
function previewData(data: number[]): string {
  if (data.length === 0) {
    return '—';
  }
  const head = data.slice(0, PREVIEW_LIMIT).map(toHexByte).join(' ');
  return data.length > PREVIEW_LIMIT ? `${head} …` : head;
}

/**
 * Motorola S-Record 解析与校验和工具：
 * 本地解析 S19 / S28 / S37 记录，校验每行校验和、识别记录类型与地址宽度，
 * 并支持一键重算全部校验和后复制修正文本。
 *
 * @returns S-Record 解析与修复界面
 */
const SrecordParser: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState<string>(SAMPLE_SRECORD);

  const result = React.useMemo(() => parseSrecord(input), [input]);
  const fixedText = React.useMemo(() => fixChecksums(input), [input]);
  const { summary } = result;

  const rangeText = React.useMemo(() => {
    if (summary.minAddress === null || summary.maxAddress === null) {
      return '—';
    }
    return `${toHexAddress(summary.minAddress)} ~ ${toHexAddress(summary.maxAddress)}`;
  }, [summary.minAddress, summary.maxAddress]);

  const loadSample = (): void => {
    setInput(SAMPLE_SRECORD);
    message.success('已载入示例 S-Record（含一条校验和错误行）');
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
      message.warning('暂无可复制的 S-Record 内容');
      return;
    }
    await copyToClipboard(fixedText);
    message.success('修正后的 S-Record 文本已复制');
  };

  return (
    <div className={styles.container}>
      <Card
        title="S-Record 输入"
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
          placeholder="粘贴 Motorola S-Record 文本，每行一条 S<type><byteCount><address><data><checksum> 记录…"
        />
        <p className={styles.hint}>
          全部解析与校验和运算均在浏览器本地完成，不发起任何网络请求；畸形行会跳过并在下方列出，不中断后续解析。
        </p>
      </Card>

      {summary.totalLines === 0 ? (
        <Empty description="粘贴 S-Record 记录后在此显示解析结果" />
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
              <Statistic title="数据地址范围" value={rangeText} />
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
                  {typeKey} × {count}
                </Tag>
              ))}
              <Tag color={summary.format === null ? 'default' : 'geekblue'}>
                格式 {summary.format ?? '未识别'}
              </Tag>
              <Tag color={summary.endAtEnd ? 'success' : 'warning'}>
                终止记录 {summary.endAtEnd ? '唯一且位于末尾' : `异常（${summary.endRecordCount} 条）`}
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
            <Table<SrecordRecord>
              size="small"
              rowKey="lineNumber"
              dataSource={result.records}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 900 }}
              columns={[
                {
                  title: '行号',
                  dataIndex: 'lineNumber',
                  width: 72,
                },
                {
                  title: '类型',
                  dataIndex: 'typeName',
                  width: 180,
                  render: (_: unknown, record: SrecordRecord) => (
                    <span>
                      {record.typeName}
                      <Tag className={styles.typeTag}>{record.type}</Tag>
                    </span>
                  ),
                },
                {
                  title: '地址',
                  dataIndex: 'address',
                  width: 120,
                  render: (_: unknown, record: SrecordRecord) => (
                    <span className={styles.mono}>
                      {toHexAddress(
                        record.address,
                        (record.addressByteWidth * 2) as 4 | 6 | 8,
                      )}
                    </span>
                  ),
                },
                {
                  title: '字节数',
                  dataIndex: 'byteCount',
                  width: 80,
                },
                {
                  title: '数据预览',
                  dataIndex: 'data',
                  width: 240,
                  render: (_: unknown, record: SrecordRecord) => (
                    <span className={styles.mono}>{previewData(record.data)}</span>
                  ),
                },
                {
                  title: 'ASCII',
                  dataIndex: 'dataAscii',
                  width: 140,
                  render: (_: unknown, record: SrecordRecord) => (
                    <span className={styles.mono}>
                      {record.absoluteAddress === null
                        ? (record.dataAscii ?? '—')
                        : decodeAscii(record.data)}
                    </span>
                  ),
                },
                {
                  title: '校验和',
                  dataIndex: 'checksumStatus',
                  render: (_: unknown, record: SrecordRecord) =>
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
            title="修复后的 S-Record 输出"
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

export default SrecordParser;
