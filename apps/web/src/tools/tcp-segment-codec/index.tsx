'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  buildTcpSegment,
  parseTcpSegment,
  type TcpBuildConfig,
  type TcpFlags,
  type TcpOption,
} from './utils/tcp';
import {
  DEFAULT_DESTINATION_IP,
  DEFAULT_SOURCE_IP,
  DEFAULT_TCP_HEX,
  FLAG_OPTIONS,
  TCP_PLACEHOLDER,
} from './constants';
import styles from './index.module.css';

const FLAG_LABELS: Array<{ key: keyof TcpFlags; label: string; color: string }> = [
  { key: 'syn', label: 'SYN', color: 'blue' },
  { key: 'ack', label: 'ACK', color: 'green' },
  { key: 'fin', label: 'FIN', color: 'orange' },
  { key: 'rst', label: 'RST', color: 'red' },
  { key: 'psh', label: 'PSH', color: 'purple' },
  { key: 'urg', label: 'URG', color: 'gold' },
  { key: 'ece', label: 'ECE', color: 'cyan' },
  { key: 'cwr', label: 'CWR', color: 'magenta' },
  { key: 'ns', label: 'NS', color: 'default' },
];

const optionColumns = [
  { title: 'Kind', dataIndex: 'kind', width: 64 },
  {
    title: '选项',
    dataIndex: 'name',
    render: (value: string, record: TcpOption) => (
      <span>
        {value}
        {record.description && <span className={styles.optionValue}>（{record.description}）</span>}
      </span>
    ),
  },
  { title: '长度', dataIndex: 'length', width: 70 },
  {
    title: '值',
    dataIndex: 'valueHex',
    width: 200,
    render: (value: string) => <span className={styles.optionValue}>{value || '—'}</span>,
  },
];

/**
 * TCP 报文段解析、伪首部校验和校验与构造器，所有运算在浏览器本地完成
 */
const TcpSegmentCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_TCP_HEX);
  const [sourceIp, setSourceIp] = React.useState(DEFAULT_SOURCE_IP);
  const [destinationIp, setDestinationIp] = React.useState(DEFAULT_DESTINATION_IP);

  const parsed = React.useMemo(() => {
    try {
      return {
        segment: parseTcpSegment(hexInput, sourceIp, destinationIp),
        error: null as string | null,
      };
    } catch (caught) {
      return { segment: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput, sourceIp, destinationIp]);

  const [buildConfig, setBuildConfig] = React.useState({
    sourcePort: 12345,
    destinationPort: 80,
    sequenceNumber: 1000,
    acknowledgmentNumber: 0,
    windowSize: 64240,
    urgentPointer: 0,
    payloadHex: '',
    mss: true,
    sackPermitted: true,
  });
  const [buildFlags, setBuildFlags] = React.useState<string[]>(['syn']);
  const [buildSourceIp, setBuildSourceIp] = React.useState(DEFAULT_SOURCE_IP);
  const [buildDestinationIp, setBuildDestinationIp] = React.useState(DEFAULT_DESTINATION_IP);

  const updateConfig = <K extends keyof typeof buildConfig>(key: K, value: (typeof buildConfig)[K]): void => {
    setBuildConfig((previous) => ({ ...previous, [key]: value }));
  };

  const built = React.useMemo(() => {
    const flags = {
      syn: buildFlags.includes('syn'),
      ack: buildFlags.includes('ack'),
      fin: buildFlags.includes('fin'),
      rst: buildFlags.includes('rst'),
      psh: buildFlags.includes('psh'),
      urg: buildFlags.includes('urg'),
      ece: buildFlags.includes('ece'),
      cwr: buildFlags.includes('cwr'),
      ns: buildFlags.includes('ns'),
    };
    const config: TcpBuildConfig = {
      sourcePort: buildConfig.sourcePort,
      destinationPort: buildConfig.destinationPort,
      sequenceNumber: buildConfig.sequenceNumber,
      acknowledgmentNumber: buildConfig.acknowledgmentNumber,
      windowSize: buildConfig.windowSize,
      urgentPointer: buildConfig.urgentPointer,
      payloadHex: buildConfig.payloadHex,
      flags,
      options: {
        mss: buildConfig.mss ? 1460 : undefined,
        sackPermitted: buildConfig.sackPermitted,
      },
      sourceIp: buildSourceIp,
      destinationIp: buildDestinationIp,
    };
    try {
      return { output: buildTcpSegment(config), error: null as string | null };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '构造失败' };
    }
  }, [buildConfig, buildFlags, buildSourceIp, buildDestinationIp]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const segment = parsed.segment;

  return (
    <div className={styles.container}>
      <Card title="TCP 报文段解析与校验和验证">
        <span className={styles.label}>TCP 报文段十六进制</span>
        <Input.TextArea
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          rows={5}
          className={styles.inputArea}
          placeholder={TCP_PLACEHOLDER}
        />
        <div className={styles.fieldRow} style={{ marginTop: 10 }}>
          <div>
            <span className={styles.label}>源 IPv4（用于伪首部校验和）</span>
            <Input
              value={sourceIp}
              onChange={(event) => setSourceIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 170 }}
            />
          </div>
          <div>
            <span className={styles.label}>目的 IPv4（用于伪首部校验和）</span>
            <Input
              value={destinationIp}
              onChange={(event) => setDestinationIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 170 }}
            />
          </div>
        </div>
        <Space wrap style={{ margin: '10px 0' }}>
          <Button icon={<ReloadOutlined />} onClick={() => setHexInput(DEFAULT_TCP_HEX)}>
            载入 SYN 示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setHexInput('')}>
            清空
          </Button>
        </Space>

        {parsed.error ? (
          <Alert type="error" showIcon message="解析失败" description={parsed.error} />
        ) : (
          segment && (
            <div className={styles.resultCard}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="源端口">{segment.sourcePort}</Descriptions.Item>
                <Descriptions.Item label="目的端口">{segment.destinationPort}</Descriptions.Item>
                <Descriptions.Item label="序列号">
                  {segment.sequenceNumber}（0x{segment.sequenceNumber.toString(16).padStart(8, '0')}）
                </Descriptions.Item>
                <Descriptions.Item label="确认号">
                  {segment.acknowledgmentNumber}（0x
                  {segment.acknowledgmentNumber.toString(16).padStart(8, '0')}）
                </Descriptions.Item>
                <Descriptions.Item label="数据偏移">{segment.dataOffset}（头部 {segment.headerLength} 字节）</Descriptions.Item>
                <Descriptions.Item label="窗口大小">{segment.windowSize}</Descriptions.Item>
                <Descriptions.Item label="紧急指针">{segment.urgentPointer}</Descriptions.Item>
                <Descriptions.Item label="报文段长度">
                  {segment.segmentLength} 字节（载荷 {segment.payloadLength} 字节）
                </Descriptions.Item>
                <Descriptions.Item label="校验和" span={2}>
                  <Space wrap>
                    <span>
                      0x{segment.checksum.toString(16).padStart(4, '0')}
                      {segment.expectedChecksum !== null &&
                        `（重算 0x${segment.expectedChecksum.toString(16).padStart(4, '0')}）`}
                    </span>
                    {segment.checksumValid === null ? (
                      <Tag>未提供合法 IPv4，跳过校验</Tag>
                    ) : segment.checksumValid ? (
                      <Tag color="green">校验通过</Tag>
                    ) : (
                      <Tag color="red">校验失败</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              <Space wrap>
                <span className={styles.label}>标志位：</span>
                {FLAG_LABELS.filter((flag) => segment.flags[flag.key]).map((flag) => (
                  <Tag key={flag.key} color={flag.color}>
                    {flag.label}
                  </Tag>
                ))}
                {FLAG_LABELS.every((flag) => !segment.flags[flag.key]) && <Tag>无</Tag>}
              </Space>

              {segment.options.length > 0 && (
                <div>
                  <span className={styles.label}>选项（{segment.options.length} 项）</span>
                  <Table
                    size="small"
                    rowKey={(record) => `${record.kind}-${record.valueHex}`}
                    pagination={false}
                    columns={optionColumns}
                    dataSource={segment.options}
                  />
                </div>
              )}

              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>载荷（每 16 字节一组）</span>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(segment.payloadHex)}>
                    复制
                  </Button>
                </div>
                <code className={styles.hexText}>{segment.payloadHex || '（无载荷）'}</code>
              </div>
            </div>
          )
        )}
      </Card>

      <Card title="TCP 报文段构造器（自动写入校验和）">
        <div className={styles.fieldRow}>
          <div>
            <span className={styles.label}>源端口</span>
            <InputNumber
              min={0}
              max={65535}
              value={buildConfig.sourcePort}
              onChange={(value) => updateConfig('sourcePort', value ?? 0)}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <span className={styles.label}>目的端口</span>
            <InputNumber
              min={0}
              max={65535}
              value={buildConfig.destinationPort}
              onChange={(value) => updateConfig('destinationPort', value ?? 0)}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <span className={styles.label}>序列号</span>
            <InputNumber
              min={0}
              max={4294967295}
              precision={0}
              value={buildConfig.sequenceNumber}
              onChange={(value) => updateConfig('sequenceNumber', value ?? 0)}
              style={{ width: 160 }}
            />
          </div>
          <div>
            <span className={styles.label}>确认号</span>
            <InputNumber
              min={0}
              max={4294967295}
              precision={0}
              value={buildConfig.acknowledgmentNumber}
              onChange={(value) => updateConfig('acknowledgmentNumber', value ?? 0)}
              style={{ width: 160 }}
            />
          </div>
          <div>
            <span className={styles.label}>窗口大小</span>
            <InputNumber
              min={0}
              max={65535}
              value={buildConfig.windowSize}
              onChange={(value) => updateConfig('windowSize', value ?? 0)}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <span className={styles.label}>紧急指针</span>
            <InputNumber
              min={0}
              max={65535}
              value={buildConfig.urgentPointer}
              onChange={(value) => updateConfig('urgentPointer', value ?? 0)}
              style={{ width: 120 }}
            />
          </div>
        </div>

        <div className={styles.fieldRow} style={{ marginTop: 12 }}>
          <div>
            <span className={styles.label}>源 IPv4</span>
            <Input
              value={buildSourceIp}
              onChange={(event) => setBuildSourceIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 160 }}
            />
          </div>
          <div>
            <span className={styles.label}>目的 IPv4</span>
            <Input
              value={buildDestinationIp}
              onChange={(event) => setBuildDestinationIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 160 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <span className={styles.label}>标志位</span>
          <Checkbox.Group
            options={FLAG_OPTIONS}
            value={buildFlags}
            onChange={(values) => setBuildFlags(values as string[])}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <span className={styles.label}>选项</span>
          <Space wrap>
            <Checkbox
              checked={buildConfig.mss}
              onChange={(event) => updateConfig('mss', event.target.checked)}
            >
              MSS = 1460
            </Checkbox>
            <Checkbox
              checked={buildConfig.sackPermitted}
              onChange={(event) => updateConfig('sackPermitted', event.target.checked)}
            >
              SACK Permitted
            </Checkbox>
          </Space>
        </div>

        <span className={styles.label} style={{ marginTop: 12 }}>
          载荷十六进制（可留空）
        </span>
        <Input.TextArea
          value={buildConfig.payloadHex}
          onChange={(event) => updateConfig('payloadHex', event.target.value)}
          rows={3}
          className={styles.inputArea}
        />

        {built.error ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="构造失败" description={built.error} />
        ) : (
          built.output && (
            <div className={styles.hexBlock} style={{ marginTop: 12 }}>
              <div className={styles.hexHeader}>
                <span>
                  报文段 {built.output.bytes.length} 字节
                  {built.output.checksum !== null &&
                    `，校验和 0x${built.output.checksum.toString(16).padStart(4, '0')}`}
                </span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(built.output!.hex)}>
                  复制
                </Button>
              </div>
              <code className={styles.hexText}>{built.output.hex}</code>
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
              TCP 固定头部 20 字节：16 位源/目的端口、32 位序列号与确认号、4 位数据偏移、9 个标志位、
              16 位窗口、16 位校验和、16 位紧急指针；数据偏移单位为 4 字节，选项区紧随固定头部。
              常见选项包括 MSS（2）、窗口缩放（3）、SACK Permitted（4）、SACK（5）与时间戳（8）。
            </p>
            <p>
              校验和覆盖 IPv4 伪首部（源地址、目的地址、保留 0、协议号 6、TCP 长度）与整个 TCP
              报文段，使用 16 位反码求和。工具在同时提供合法源/目的 IPv4 时校验并重算校验和；
              构造时自动写入正确校验和。所有计算均在本机浏览器完成。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default TcpSegmentCodec;
