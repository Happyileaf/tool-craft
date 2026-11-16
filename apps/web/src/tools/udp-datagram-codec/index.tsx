'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  buildUdpDatagram,
  bytesToHex,
  parseUdpDatagram,
  type ChecksumMode,
  type IpVersion,
  type UdpFieldView,
} from './utils/udp';
import {
  BYTES_PER_LINE,
  DEFAULT_DESTINATION_IPV4,
  DEFAULT_DESTINATION_IPV6,
  DEFAULT_SOURCE_IPV4,
  DEFAULT_SOURCE_IPV6,
  DEFAULT_UDP_HEX,
  UDP_PLACEHOLDER,
} from './constants';
import styles from './index.module.css';

const fieldColumns = [
  { title: '字段', dataIndex: 'field' },
  {
    title: '字节偏移',
    dataIndex: 'offset',
    width: 90,
    render: (value: number, record: UdpFieldView) =>
      record.length === 0 ? '—' : `${value} – ${value + record.length - 1}`,
  },
  { title: '长度（字节）', dataIndex: 'length', width: 110 },
  {
    title: '值',
    dataIndex: 'value',
    render: (value: string) => <span className={styles.monoCell}>{value}</span>,
  },
];

/** 将字节按 16 字节分行，带起始偏移标注 */
function renderHexLines(bytes: number[]): React.ReactNode {
  const lines: React.ReactNode[] = [];
  for (let offset = 0; offset < bytes.length; offset += BYTES_PER_LINE) {
    const chunk = bytes.slice(offset, offset + BYTES_PER_LINE);
    lines.push(
      <div className={styles.hexLine} key={offset}>
        <span className={styles.hexOffset}>{offset.toString(16).padStart(4, '0').toUpperCase()}</span>
        <span className={styles.hexLineValue}>{bytesToHex(chunk, BYTES_PER_LINE)}</span>
      </div>,
    );
  }
  return lines;
}

/**
 * UDP 报文头（RFC 768）构造与十六进制解析器，含 IPv4/IPv6 伪首部校验和，
 * 所有运算在浏览器本地完成
 */
const UdpDatagramCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_UDP_HEX);
  const [parseIpVersion, setParseIpVersion] = React.useState<IpVersion>('ipv4');
  const [parseSrcIp, setParseSrcIp] = React.useState(DEFAULT_SOURCE_IPV4);
  const [parseDstIp, setParseDstIp] = React.useState(DEFAULT_DESTINATION_IPV4);

  const switchParseVersion = (version: IpVersion): void => {
    setParseIpVersion(version);
    if (version === 'ipv4') {
      setParseSrcIp(DEFAULT_SOURCE_IPV4);
      setParseDstIp(DEFAULT_DESTINATION_IPV4);
    } else {
      setParseSrcIp(DEFAULT_SOURCE_IPV6);
      setParseDstIp(DEFAULT_DESTINATION_IPV6);
    }
  };

  const parsed = React.useMemo(() => {
    try {
      return {
        datagram: parseUdpDatagram(hexInput, {
          ipVersion: parseIpVersion,
          srcIp: parseSrcIp,
          dstIp: parseDstIp,
        }),
        error: null as string | null,
      };
    } catch (caught) {
      return { datagram: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput, parseIpVersion, parseSrcIp, parseDstIp]);

  const [sourcePort, setSourcePort] = React.useState(1234);
  const [destinationPort, setDestinationPort] = React.useState(80);
  const [payloadMode, setPayloadMode] = React.useState<'text' | 'hex'>('hex');
  const [payloadText, setPayloadText] = React.useState('Test.\n');
  const [payloadHex, setPayloadHex] = React.useState('54 65 73 74 2e 0a');
  const [checksumMode, setChecksumMode] = React.useState<ChecksumMode>('ipv4');
  const [buildIpVersion, setBuildIpVersion] = React.useState<IpVersion>('ipv4');
  const [buildSrcIp, setBuildSrcIp] = React.useState(DEFAULT_SOURCE_IPV4);
  const [buildDstIp, setBuildDstIp] = React.useState(DEFAULT_DESTINATION_IPV4);

  const switchChecksumMode = (mode: ChecksumMode): void => {
    setChecksumMode(mode);
    if (mode === 'ipv4') {
      setBuildIpVersion('ipv4');
      setBuildSrcIp(DEFAULT_SOURCE_IPV4);
      setBuildDstIp(DEFAULT_DESTINATION_IPV4);
    } else if (mode === 'ipv6') {
      setBuildIpVersion('ipv6');
      setBuildSrcIp(DEFAULT_SOURCE_IPV6);
      setBuildDstIp(DEFAULT_DESTINATION_IPV6);
    }
  };

  const built = React.useMemo(() => {
    try {
      return {
        output: buildUdpDatagram({
          sourcePort,
          destinationPort,
          checksumMode,
          ipVersion: buildIpVersion,
          srcIp: buildSrcIp,
          dstIp: buildDstIp,
          ...(payloadMode === 'hex' ? { payloadHex } : { payloadText }),
        }),
        error: null as string | null,
      };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '构造失败' };
    }
  }, [
    sourcePort,
    destinationPort,
    payloadMode,
    payloadText,
    payloadHex,
    checksumMode,
    buildIpVersion,
    buildSrcIp,
    buildDstIp,
  ]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const datagram = parsed.datagram;

  return (
    <div className={styles.container}>
      <Card title="UDP 报文解析与校验和验证（RFC 768）">
        <span className={styles.label}>UDP 报文十六进制</span>
        <Input.TextArea
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          rows={5}
          className={styles.inputArea}
          placeholder={UDP_PLACEHOLDER}
        />
        <div className={styles.fieldRow} style={{ marginTop: 10 }}>
          <div>
            <span className={styles.label}>IP 版本（伪首部）</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={parseIpVersion}
              onChange={(event) => switchParseVersion(event.target.value as IpVersion)}
              options={[
                { label: 'IPv4', value: 'ipv4' },
                { label: 'IPv6', value: 'ipv6' },
              ]}
            />
          </div>
          <div>
            <span className={styles.label}>源 IP（用于伪首部校验和）</span>
            <Input
              value={parseSrcIp}
              onChange={(event) => setParseSrcIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 200 }}
            />
          </div>
          <div>
            <span className={styles.label}>目的 IP（用于伪首部校验和）</span>
            <Input
              value={parseDstIp}
              onChange={(event) => setParseDstIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 200 }}
            />
          </div>
        </div>
        <Space wrap style={{ margin: '10px 0' }}>
          <Button icon={<ReloadOutlined />} onClick={() => setHexInput(DEFAULT_UDP_HEX)}>
            载入示例报文
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setHexInput('')}>
            清空
          </Button>
        </Space>

        {parsed.error ? (
          <Alert type="error" showIcon message="解析失败" description={parsed.error} />
        ) : (
          datagram && (
            <div className={styles.resultCard}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="源端口">{datagram.sourcePort}</Descriptions.Item>
                <Descriptions.Item label="目的端口">{datagram.destinationPort}</Descriptions.Item>
                <Descriptions.Item label="长度 Length">
                  {datagram.length} 字节（载荷 {datagram.payloadLength} 字节）
                </Descriptions.Item>
                <Descriptions.Item label="实际报文长度">
                  {datagram.datagramLength} 字节
                </Descriptions.Item>
                <Descriptions.Item label="校验和" span={2}>
                  <Space wrap>
                    <span>
                      0x{datagram.checksum.toString(16).padStart(4, '0').toUpperCase()}
                      {datagram.expectedChecksum !== null &&
                        `（重算 0x${datagram.expectedChecksum
                          .toString(16)
                          .padStart(4, '0')
                          .toUpperCase()}）`}
                    </span>
                    {datagram.checksumValid === null ? (
                      datagram.checksum === 0 ? (
                        <Tag>未启用（IPv4 校验和为 0）</Tag>
                      ) : (
                        <Tag>未提供合法伪首部地址，跳过校验</Tag>
                      )
                    ) : datagram.checksumValid ? (
                      <Tag color="green">校验通过</Tag>
                    ) : (
                      <Tag color="red">校验失败</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>载荷十六进制（{datagram.payloadLength} 字节）</span>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copy(datagram.payloadHex)}
                  >
                    复制
                  </Button>
                </div>
                <code className={styles.hexText}>{datagram.payloadHex || '（无载荷）'}</code>
                {datagram.payloadText && (
                  <div style={{ marginTop: 6 }}>
                    <span className={styles.label}>载荷文本（UTF-8，非法字节以替换字符显示）</span>
                    <code className={styles.monoCell}>{datagram.payloadText}</code>
                  </div>
                )}
              </div>

              <div>
                <span className={styles.label}>字节偏移表</span>
                <Table
                  size="small"
                  rowKey="field"
                  pagination={false}
                  columns={fieldColumns}
                  dataSource={datagram.fieldViews}
                />
              </div>
            </div>
          )
        )}
      </Card>

      <Card title="UDP 报文构造器（自动写入校验和）">
        <div className={styles.fieldRow}>
          <div>
            <span className={styles.label}>源端口（0–65535，0 合法）</span>
            <InputNumber
              min={0}
              max={65535}
              precision={0}
              value={sourcePort}
              onChange={(value) => setSourcePort(value ?? 0)}
              style={{ width: 140 }}
            />
          </div>
          <div>
            <span className={styles.label}>目的端口（1–65535）</span>
            <InputNumber
              min={0}
              max={65535}
              precision={0}
              value={destinationPort}
              onChange={(value) => setDestinationPort(value ?? 0)}
              style={{ width: 140 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <span className={styles.label}>载荷输入模式</span>
          <Radio.Group
            optionType="button"
            value={payloadMode}
            onChange={(event) => setPayloadMode(event.target.value as 'text' | 'hex')}
            options={[
              { label: '文本（UTF-8）', value: 'text' },
              { label: '十六进制', value: 'hex' },
            ]}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          {payloadMode === 'hex' ? (
            <>
              <span className={styles.label}>载荷十六进制（可留空）</span>
              <Input.TextArea
                value={payloadHex}
                onChange={(event) => setPayloadHex(event.target.value)}
                rows={3}
                className={styles.inputArea}
                placeholder="例如 54 65 73 74 2E 0A"
              />
            </>
          ) : (
            <>
              <span className={styles.label}>载荷文本（TextEncoder 编码为 UTF-8）</span>
              <Input.TextArea
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
                rows={3}
                className={styles.inputArea}
              />
            </>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <span className={styles.label}>校验和模式</span>
          <Radio.Group
            value={checksumMode}
            onChange={(event) => switchChecksumMode(event.target.value as ChecksumMode)}
          >
            <Radio value="disabled">禁用（仅 IPv4 合法）</Radio>
            <Radio value="ipv4">IPv4 伪首部</Radio>
            <Radio value="ipv6">IPv6 伪首部</Radio>
          </Radio.Group>
        </div>

        <div className={styles.fieldRow} style={{ marginTop: 12 }}>
          <div>
            <span className={styles.label}>源 IP（伪首部）</span>
            <Input
              value={buildSrcIp}
              onChange={(event) => setBuildSrcIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 220 }}
            />
          </div>
          <div>
            <span className={styles.label}>目的 IP（伪首部）</span>
            <Input
              value={buildDstIp}
              onChange={(event) => setBuildDstIp(event.target.value)}
              className={styles.monoInput}
              style={{ width: 220 }}
            />
          </div>
        </div>

        {built.error ? (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="构造失败"
            description={built.error}
          />
        ) : (
          built.output && (
            <div className={styles.resultCard} style={{ marginTop: 12 }}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="UDP 长度">{built.output.length} 字节</Descriptions.Item>
                <Descriptions.Item label="校验和">
                  {built.output.checksum === null
                    ? '0x0000（已禁用）'
                    : `0x${built.output.checksum
                        .toString(16)
                        .padStart(4, '0')
                        .toUpperCase()}`}
                </Descriptions.Item>
              </Descriptions>
              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>完整报文（{built.output.bytes.length} 字节，无分隔大写形式）</span>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copy(built.output!.hex.replace(/\s/g, ''))}
                  >
                    复制
                  </Button>
                </div>
                <code className={styles.hexText}>{built.output.hex}</code>
              </div>
              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>按 {BYTES_PER_LINE} 字节分行视图</span>
                </div>
                {renderHexLines(built.output.bytes)}
              </div>
              <div>
                <span className={styles.label}>字节偏移表</span>
                <Table
                  size="small"
                  rowKey="field"
                  pagination={false}
                  columns={fieldColumns}
                  dataSource={built.output.fieldViews}
                />
              </div>
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="UDP 首部与校验和说明（RFC 768）"
        description={
          <div className={styles.hint}>
            <p>
              UDP 首部固定 8 字节：16 位源端口、16 位目的端口、16 位长度（首部 + 载荷，最小
              8）、16 位校验和，其后为变长载荷。源端口允许为 0，目的端口不能为 0；本工具对长度字段与实际字节数做一致性校验。
            </p>
            <p>
              校验和覆盖伪首部与整个 UDP 报文，采用 16 位反码求和。IPv4
              伪首部为源/目的地址、保留字节 0、协议号 17 与 UDP 长度；IPv6
              伪首部为 16 字节源/目的地址、4 字节 UDP 长度、3 字节零与下一头部 17（RFC 8200）。
              IPv4 允许校验和置 0 表示未启用；IPv6 强制要求校验和，禁用将直接报错。
            </p>
            <p>
              当参与求和的总字节数为奇数时，末尾在计算内部补一个 0 字节，该补字节不会写入实际报文；
              若反码求和取反结果为 0x0000，按 RFC 768 规定以传输值 0xFFFF 写入。所有解析与构造均在本机浏览器本地完成，不上传任何数据。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default UdpDatagramCodec;
