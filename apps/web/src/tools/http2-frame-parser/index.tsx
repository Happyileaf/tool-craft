'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { parseHexInput, parseFrames, SAMPLE_HEX, type ParsedFrame } from './utils/http2Frame';
import { FRAME_TYPE_REFERENCE } from './constants';
import styles from './index.module.css';

/** 按帧类型返回表格标签颜色 */
function typeColor(typeName: string): string {
  if (typeName === 'SETTINGS' || typeName === 'WINDOW_UPDATE' || typeName === 'PING') {
    return 'blue';
  }
  if (typeName === 'GOAWAY' || typeName === 'RST_STREAM') {
    return 'red';
  }
  if (typeName === 'HEADERS' || typeName === 'DATA' || typeName === 'CONTINUATION') {
    return 'green';
  }
  return 'default';
}

/**
 * HTTP/2 帧头解析与帧序列查看器：解析 RFC 7540 9 字节帧头与
 * SETTINGS / WINDOW_UPDATE / PING / GOAWAY 等载荷，不实现 HPACK 解压。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const Http2FrameParser: React.FC<ToolComponentProps> = (_props) => {
  const [raw, setRaw] = React.useState(SAMPLE_HEX);

  const parsed = React.useMemo(() => parseHexInput(raw), [raw]);
  const result = React.useMemo(
    () => (parsed.errors.length === 0 ? parseFrames(parsed.bytes) : null),
    [parsed],
  );

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  const columns = [
    { title: '#', dataIndex: 'index', width: 56, render: (v: number) => <span className={styles.mono}>{v}</span> },
    { title: '偏移', dataIndex: 'offset', width: 80, render: (v: number) => <span className={styles.mono}>{v}</span> },
    {
      title: '类型',
      dataIndex: 'typeName',
      width: 150,
      render: (value: string) => <Tag color={typeColor(value)}>{value}</Tag>,
    },
    { title: '长度', dataIndex: 'length', width: 90, render: (v: number) => <span className={styles.mono}>{v}</span> },
    {
      title: '标志',
      dataIndex: 'flagNames',
      render: (names: string[], frame: ParsedFrame) =>
        names.length ? names.map((name) => <Tag key={name}>{name}</Tag>) : <span className={styles.mono}>0x{frame.flags.toString(16).padStart(2, '0')}</span>,
    },
    {
      title: '流标识',
      dataIndex: 'streamId',
      width: 100,
      render: (v: number) => <span className={styles.mono}>{v}</span>,
    },
    { title: '载荷摘要', dataIndex: 'payloadSummary' },
    {
      title: '告警',
      dataIndex: 'warnings',
      width: 220,
      render: (warnings: string[]) =>
        warnings.length ? (
          <Space direction="vertical" size={2}>
            {warnings.map((warning) => (
              <Tag key={warning} color="orange">
                {warning}
              </Tag>
            ))}
          </Space>
        ) : (
          <Tag color="green">合规</Tag>
        ),
    },
  ];

  const warningCount = result?.frames.reduce((sum, frame) => sum + frame.warnings.length, 0) ?? 0;

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">纯浏览器本地解析，依据 RFC 7540；不实现 HPACK（RFC 7541）首部解压</Tag>

          <Space wrap>
            <Button size="small" onClick={() => setRaw(SAMPLE_HEX)}>
              载入内置样例
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(raw)}>
              复制输入
            </Button>
            <Button size="small" danger onClick={() => setRaw('')}>
              清空
            </Button>
          </Space>

          <Input.TextArea
            className={styles.textarea}
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            rows={6}
            placeholder="粘贴 HTTP/2 帧十六进制（可含空格、换行、0x 前缀；可省略连接前导 PRI * HTTP/2.0）"
            spellCheck={false}
          />

          {parsed.errors.map((error) => (
            <Alert key={error} type="error" showIcon message={error} />
          ))}
          {result?.errors.map((error) => (
            <Alert key={error} type="error" showIcon message={error} />
          ))}

          {result && result.frames.length > 0 && (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>解析帧数</span>
                  <span className={styles.summaryValue}>{result.frames.length}</span>
                </div>
                <div className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>已消费字节</span>
                  <span className={styles.summaryValue}>{result.consumedBytes}</span>
                </div>
                <div className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>残余字节</span>
                  <span className={styles.summaryValue}>{result.trailingBytes}</span>
                </div>
                <div className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>告警数</span>
                  <span className={styles.summaryValue}>{warningCount}</span>
                </div>
              </div>

              <Table
                size="small"
                rowKey={(record) => String(record.index)}
                columns={columns}
                dataSource={result.frames}
                pagination={false}
                scroll={{ x: 1000 }}
              />
            </>
          )}

          <Card type="inner" title="帧头结构与类型速查（RFC 7540 §4 / §11）" size="small">
            <p className={styles.hint}>
              每帧以 9 字节定长帧头开始：24 位载荷长度、8 位类型、8 位标志、1 位保留 R 与 31 位流标识。
              连接级帧（SETTINGS / PING / GOAWAY / 连接级 WINDOW_UPDATE）的流标识必须为 0。
            </p>
            <Table
              size="small"
              rowKey={(record) => record.code}
              columns={[
                { title: '编码', dataIndex: 'code', width: 90, render: (v: string) => <span className={styles.mono}>{v}</span> },
                { title: '类型', dataIndex: 'name', width: 160 },
                { title: '说明', dataIndex: 'note' },
              ]}
              dataSource={[...FRAME_TYPE_REFERENCE]}
              pagination={false}
            />
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default Http2FrameParser;
