'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CopyOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  BUILDABLE_OPTION_OPTIONS,
  DEFAULT_BUILD_CONFIG,
  DHCP_MESSAGE_TYPE_OPTIONS,
  HEX_PLACEHOLDER,
  MODE_OPTIONS,
  OPTION_VALUE_PLACEHOLDERS,
  SAMPLE_DISCOVER_HEX,
} from './constants';
import styles from './index.module.css';
import {
  DhcpError,
  buildDhcpPacket,
  bytesToHex,
  parseDhcpPacket,
  type DhcpBuildOption,
  type DhcpOption,
} from './utils/dhcp';

const { Text, Title } = Typography;
const { TextArea } = Input;

type Mode = 'parse' | 'build';

interface OptionRow {
  key: number;
  type: number;
  value: string;
}

let optionRowSeq = 1;

const optionColumns: ColumnsType<DhcpOption> = [
  { title: 'Type', dataIndex: 'type', width: 70 },
  { title: '名称', dataIndex: 'name', width: 220, render: (name: string, row) => (
    <Space size={4}>
      <span>{name}</span>
      {row.type === 53 ? <Tag color="blue">消息类型</Tag> : null}
    </Space>
  ) },
  { title: '长度', dataIndex: 'length', width: 80 },
  { title: '可读值', dataIndex: 'display' },
  { title: '原始 HEX', dataIndex: 'valueHex', render: (hex: string) => (
    <Text code className={styles.mono}>{hex || '—'}</Text>
  ) },
];

export default function Dhcpv4PacketCodecTool(_props: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('parse');
  const [parseInput, setParseInput] = useState('');

  const [messageType, setMessageType] = useState(DEFAULT_BUILD_CONFIG.messageType);
  const [xid, setXid] = useState(DEFAULT_BUILD_CONFIG.xid);
  const [chaddr, setChaddr] = useState(DEFAULT_BUILD_CONFIG.chaddr);
  const [secs, setSecs] = useState('0');
  const [flags, setFlags] = useState('0');
  const [ciaddr, setCiaddr] = useState('');
  const [yiaddr, setYiaddr] = useState('');
  const [siaddr, setSiaddr] = useState('');
  const [giaddr, setGiaddr] = useState('');
  const [sname, setSname] = useState('');
  const [file, setFile] = useState('');
  const [optionRows, setOptionRows] = useState<OptionRow[]>([
    { key: optionRowSeq, type: 51, value: '86400' },
    { key: optionRowSeq + 1, type: 55, value: '1, 3, 6' },
  ]);
  optionRowSeq = 3;

  const parseResult = useMemo(() => {
    if (mode !== 'parse' || !parseInput.trim()) {
      return null;
    }
    try {
      return { ok: true as const, packet: parseDhcpPacket(parseInput) };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof DhcpError ? error.message : '解析失败',
      };
    }
  }, [mode, parseInput]);

  const buildResult = useMemo(() => {
    if (mode !== 'build') {
      return null;
    }
    try {
      const xidNumber = xid.trim().toLowerCase().startsWith('0x')
        ? Number.parseInt(xid.trim().slice(2), 16)
        : Number(xid);
      const options: DhcpBuildOption[] = optionRows
        .filter((row) => row.value.trim() !== '')
        .map((row) => ({ type: row.type, value: row.value }));
      const bytes = buildDhcpPacket({
        xid: xidNumber,
        chaddr,
        messageType,
        secs: Number(secs) || 0,
        flags: Number(flags) || 0,
        ciaddr: ciaddr || undefined,
        yiaddr: yiaddr || undefined,
        siaddr: siaddr || undefined,
        giaddr: giaddr || undefined,
        sname: sname || undefined,
        file: file || undefined,
        options,
      });
      const roundTrip = parseDhcpPacket(bytes);
      return { ok: true as const, bytes, hex: bytesToHex(bytes), roundTrip };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof DhcpError ? error.message : '构造失败',
      };
    }
  }, [mode, xid, chaddr, messageType, secs, flags, ciaddr, yiaddr, siaddr, giaddr, sname, file, optionRows]);

  const handleCopy = async (text: string, label: string): Promise<void> => {
    try {
      await copyToClipboard(text);
      message.success(`${label}已复制`);
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const addOptionRow = (): void => {
    optionRowSeq += 1;
    setOptionRows((rows) => [...rows, { key: optionRowSeq, type: 50, value: '' }]);
  };

  const removeOptionRow = (key: number): void => {
    setOptionRows((rows) => rows.filter((row) => row.key !== key));
  };

  const updateOptionRow = (key: number, patch: Partial<OptionRow>): void => {
    setOptionRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const packet = parseResult?.ok ? parseResult.packet : null;

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={MODE_OPTIONS}
      />

      {mode === 'parse' ? (
        <>
          <Card size="small" title="粘贴 DHCPv4 报文十六进制">
            <Space direction="vertical" className="w-full" size={8}>
              <TextArea
                value={parseInput}
                onChange={(event) => setParseInput(event.target.value)}
                rows={6}
                placeholder={HEX_PLACEHOLDER}
                className={styles.inputArea}
              />
              <Space wrap>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => setParseInput(SAMPLE_DISCOVER_HEX)}
                >
                  填充示例（DISCOVER）
                </Button>
                <Button size="small" onClick={() => setParseInput('')}>
                  清空
                </Button>
              </Space>
            </Space>
          </Card>

          {parseResult && !parseResult.ok ? (
            <Alert type="error" showIcon message="解析失败" description={parseResult.error} />
          ) : null}

          {packet ? (
            <>
              {packet.warnings.length > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message="解析警告（不阻断）"
                  description={
                    <ul className={styles.warningList}>
                      {packet.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  }
                />
              ) : null}

              <Card size="small" title="BOOTP 定长头（236 字节）">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="op">
                    {packet.header.op}（{packet.header.opName}）
                  </Descriptions.Item>
                  <Descriptions.Item label="htype / hlen / hops">
                    {packet.header.htype} / {packet.header.hlen} / {packet.header.hops}
                  </Descriptions.Item>
                  <Descriptions.Item label="xid">
                    <Text code>0x{packet.header.xid.toString(16).padStart(8, '0').toUpperCase()}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="secs / flags">
                    {packet.header.secs} / 0x{packet.header.flags.toString(16).padStart(4, '0').toUpperCase()}
                  </Descriptions.Item>
                  <Descriptions.Item label="ciaddr">{packet.header.ciaddr}</Descriptions.Item>
                  <Descriptions.Item label="yiaddr">{packet.header.yiaddr}</Descriptions.Item>
                  <Descriptions.Item label="siaddr">{packet.header.siaddr}</Descriptions.Item>
                  <Descriptions.Item label="giaddr">{packet.header.giaddr}</Descriptions.Item>
                  <Descriptions.Item label="chaddr (MAC)" span={2}>
                    <Text code>{packet.header.chaddrMac}</Text>
                    <Text type="secondary" className={styles.inlineHint}>
                      完整 16 字节：{packet.header.chaddrHex}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="sname" span={2}>
                    {packet.header.sname || '（空）'}
                  </Descriptions.Item>
                  <Descriptions.Item label="file" span={2}>
                    {packet.header.file || '（空）'}
                  </Descriptions.Item>
                  <Descriptions.Item label="magic cookie" span={2}>
                    <Tag color="success">
                      0x{packet.cookie.toString(16).padStart(8, '0').toUpperCase()} 校验通过
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card size="small" title={`Options（${packet.options.length} 项，TLV）`}>
                <Table<DhcpOption>
                  rowKey={(row) => `${row.type}-${row.valueHex}`}
                  columns={optionColumns}
                  dataSource={packet.options}
                  pagination={false}
                  size="small"
                  scroll={{ x: 720 }}
                />
              </Card>

              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>完整报文 HEX（{packet.packetLength} 字节）</span>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(packet.packetHex, '报文 HEX')}
                  >
                    复制
                  </Button>
                </div>
                <div className={styles.hexText}>{packet.packetHex}</div>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <>
          <Card size="small" title="BOOTP 头字段">
            <Space wrap size="middle">
              <div>
                <span className={styles.label}>消息类型（option 53 自动写入）</span>
                <Select
                  value={messageType}
                  onChange={setMessageType}
                  options={DHCP_MESSAGE_TYPE_OPTIONS}
                  style={{ width: 200 }}
                />
              </div>
              <div>
                <span className={styles.label}>xid（0x 或十进制）</span>
                <Input
                  value={xid}
                  onChange={(event) => setXid(event.target.value)}
                  className={styles.monoInput}
                  style={{ width: 160 }}
                />
              </div>
              <div>
                <span className={styles.label}>客户端 MAC（chaddr）</span>
                <Input
                  value={chaddr}
                  onChange={(event) => setChaddr(event.target.value)}
                  className={styles.monoInput}
                  style={{ width: 200 }}
                />
              </div>
              <div>
                <span className={styles.label}>secs</span>
                <Input
                  value={secs}
                  onChange={(event) => setSecs(event.target.value)}
                  className={styles.monoInput}
                  style={{ width: 90 }}
                />
              </div>
              <div>
                <span className={styles.label}>flags</span>
                <Input
                  value={flags}
                  onChange={(event) => setFlags(event.target.value)}
                  className={styles.monoInput}
                  style={{ width: 90 }}
                />
              </div>
            </Space>
            <Space wrap size="middle" style={{ marginTop: 12 }}>
              <div>
                <span className={styles.label}>ciaddr</span>
                <Input value={ciaddr} onChange={(e) => setCiaddr(e.target.value)} className={styles.monoInput} style={{ width: 150 }} placeholder="0.0.0.0" />
              </div>
              <div>
                <span className={styles.label}>yiaddr</span>
                <Input value={yiaddr} onChange={(e) => setYiaddr(e.target.value)} className={styles.monoInput} style={{ width: 150 }} placeholder="可留空" />
              </div>
              <div>
                <span className={styles.label}>siaddr</span>
                <Input value={siaddr} onChange={(e) => setSiaddr(e.target.value)} className={styles.monoInput} style={{ width: 150 }} placeholder="可留空" />
              </div>
              <div>
                <span className={styles.label}>giaddr</span>
                <Input value={giaddr} onChange={(e) => setGiaddr(e.target.value)} className={styles.monoInput} style={{ width: 150 }} placeholder="可留空" />
              </div>
            </Space>
            <Space wrap size="middle" style={{ marginTop: 12 }}>
              <div>
                <span className={styles.label}>sname（可选，≤64 字节）</span>
                <Input value={sname} onChange={(e) => setSname(e.target.value)} style={{ width: 240 }} />
              </div>
              <div>
                <span className={styles.label}>file（可选，≤128 字节）</span>
                <Input value={file} onChange={(e) => setFile(e.target.value)} style={{ width: 240 }} />
              </div>
            </Space>
          </Card>

          <Card
            size="small"
            title="自定义 Options"
            extra={<Button size="small" icon={<PlusOutlined />} onClick={addOptionRow}>添加 option</Button>}
          >
            <Space direction="vertical" className="w-full" size={8}>
              {optionRows.map((row) => (
                <Space key={row.key} wrap align="baseline">
                  <Select
                    value={row.type}
                    onChange={(value) => updateOptionRow(row.key, { type: value })}
                    options={BUILDABLE_OPTION_OPTIONS}
                    style={{ width: 300 }}
                    showSearch
                    optionFilterProp="label"
                  />
                  <Input
                    value={row.value}
                    onChange={(event) => updateOptionRow(row.key, { value: event.target.value })}
                    placeholder={OPTION_VALUE_PLACEHOLDERS[row.type] ?? '输入 option 值'}
                    className={styles.monoInput}
                    style={{ width: 320 }}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => removeOptionRow(row.key)}
                  >
                    移除
                  </Button>
                </Space>
              ))}
              <Text type="secondary" className={styles.hint}>
                option 53（DHCP Message Type）由上方消息类型自动写入；构造时自动补 magic cookie、按 4 字节 padding 对齐并以 0xFF end 收尾。
              </Text>
            </Space>
          </Card>

          {buildResult && !buildResult.ok ? (
            <Alert type="error" showIcon message="构造失败" description={buildResult.error} />
          ) : null}

          {buildResult?.ok ? (
            <div className={styles.hexBlock}>
              <div className={styles.hexHeader}>
                <span>
                  构造结果（{buildResult.bytes.length} 字节，往返解析消息类型：
                  {buildResult.roundTrip.options.find((o) => o.type === 53)?.display ?? '—'}）
                </span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(buildResult.hex, '报文 HEX')}
                >
                  复制
                </Button>
              </div>
              <div className={styles.hexText}>{buildResult.hex}</div>
            </div>
          ) : null}
        </>
      )}

      <Title level={5} className="!mb-0">工作原理</Title>
      <Text type="secondary" className={styles.hint}>
        DHCPv4（RFC 2131）报文 = 236 字节 BOOTP 定长头 + 4 字节 magic cookie
        0x63825363 + 变长 options（TLV：type/len/value 各字段，0x00 为 padding、0xFF 为 end）。
        所有多字节整数按大端读写，全部字节运算均在浏览器本地通过 DataView/Uint8Array 完成，不发送任何网络数据。
      </Text>
    </div>
  );
}
