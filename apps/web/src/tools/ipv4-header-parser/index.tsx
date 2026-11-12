'use client';

import React from 'react';
import { Alert, Button, Card, Descriptions, Input, Space, Table, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import { bytesToHex, buildIpv4Header, parseIpv4Header } from './utils/ipv4';
import { DEFAULT_HEADER_HEX, FIELD_LABELS, HEADER_PLACEHOLDER } from './constants';
import styles from './index.module.css';

/**
 * IPv4 数据报头（RFC 791）解析与校验和验证工具，
 * 所有计算在浏览器本地完成
 */
const Ipv4HeaderParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_HEADER_HEX);

  const result = React.useMemo(() => {
    try {
      return { header: parseIpv4Header(hexInput), error: null as string | null };
    } catch (caught) {
      return { header: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const loadValidSample = (): void => {
    const bytes = buildIpv4Header({
      totalLength: 60,
      identification: 0x1c46,
      df: true,
      ttl: 64,
      protocol: 17,
      source: '192.168.1.10',
      destination: '192.168.1.1',
    });
    setHexInput(bytesToHex(bytes));
  };

  const fieldRows = React.useMemo(() => {
    if (!result.header) {
      return [];
    }
    const h = result.header;
    return [
      { key: 'version', name: FIELD_LABELS.version, value: `${h.version}` },
      { key: 'ihl', name: FIELD_LABELS.ihl, value: `${h.ihl}（${h.headerLength} 字节）` },
      { key: 'dscp', name: FIELD_LABELS.dscp, value: `${h.dscp}（0x${h.dscp.toString(16)}）` },
      { key: 'ecn', name: FIELD_LABELS.ecn, value: `${h.ecn}` },
      { key: 'totalLength', name: FIELD_LABELS.totalLength, value: `${h.totalLength} 字节` },
      { key: 'identification', name: FIELD_LABELS.identification, value: `0x${h.identification.toString(16).padStart(4, '0')}（${h.identification}）` },
      {
        key: 'flags',
        name: '标志 Flags',
        value: `保留位=${h.flags.reserved ? 1 : 0} DF=${h.flags.df ? 1 : 0} MF=${h.flags.mf ? 1 : 0}`,
      },
      { key: 'fragmentOffset', name: FIELD_LABELS.fragmentOffset, value: `${h.fragmentOffset}` },
      { key: 'ttl', name: FIELD_LABELS.ttl, value: `${h.ttl} 跳` },
      { key: 'protocol', name: FIELD_LABELS.protocol, value: `${h.protocol}（${h.protocolName}）` },
      {
        key: 'checksum',
        name: FIELD_LABELS.headerChecksum,
        value: `0x${h.headerChecksum.toString(16).padStart(4, '0')}`,
      },
      { key: 'source', name: FIELD_LABELS.sourceAddress, value: h.sourceAddress },
      { key: 'destination', name: FIELD_LABELS.destinationAddress, value: h.destinationAddress },
      { key: 'options', name: '选项 Options', value: h.optionsHex || '无（IHL=5）' },
      { key: 'payload', name: FIELD_LABELS.payloadLength, value: `${h.payloadLength} 字节` },
    ];
  }, [result.header]);

  return (
    <div className={styles.container}>
      <Card title="IPv4 数据报头解析与校验和验证器（RFC 791）">
        <span className={styles.label}>数据报头部十六进制</span>
        <Input.TextArea
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          rows={4}
          className={styles.inputArea}
          placeholder={HEADER_PLACEHOLDER}
        />
        <Space wrap style={{ margin: '10px 0' }}>
          <Button icon={<ReloadOutlined />} onClick={loadValidSample}>
            载入合法示例（自动算校验和）
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => setHexInput(DEFAULT_HEADER_HEX)}
          >
            重置
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setHexInput('')}>
            清空
          </Button>
        </Space>

        {result.error ? (
          <Alert type="error" showIcon message="解析失败" description={result.error} />
        ) : (
          result.header && (
            <div className={styles.resultCard}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="校验和验证">
                  {result.header.checksumValid ? (
                    <Tag color="green">通过（重算结果为 0x0000）</Tag>
                  ) : (
                    <Tag color="red">
                      失败（重算结果 0x
                      {result.header.computedChecksum.toString(16).padStart(4, '0')}）
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="协议">
                  <Tag color="blue">{result.header.protocolName}</Tag>
                </Descriptions.Item>
              </Descriptions>

              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>头部字节（每 4 字节一组，共 {result.header.headerLength} 字节）</span>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(result.header!.headerHex)}>
                    复制
                  </Button>
                </div>
                <code className={styles.hexText}>{result.header.headerHex}</code>
              </div>

              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={fieldRows}
                columns={[
                  { title: '字段', dataIndex: 'name', key: 'name', width: 240 },
                  { title: '解析值', dataIndex: 'value', key: 'value' },
                ]}
              />
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="字段与校验和说明"
        description={
          <div className={styles.hint}>
            <p>
              IPv4 头部前 20 字节为固定部分，IHL 字段以 32 位字为单位指示总首部长度（最小
              5，即 20 字节），可选选项字段长度为 IHL×4−20。标志位含 DF（不分片）与
              MF（还有分片），片偏移以 8 字节为单位。
            </p>
            <p>
              首部校验和依据 RFC 1071：把头部按 16 位字求和、回卷进位后取反。验证时把接收到的头部（含原校验和字段）整体代入，
              若数据未损坏则结果必为 0x0000。注意每经过一个路由器 TTL 减 1，都需要重新计算该校验和。所有解析均在本机浏览器完成。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default Ipv4HeaderParser;
