'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { DEFAULT_BUILD, SAMPLE_ARP_HEX, SAMPLE_ARP_REQUEST } from './constants';
import {
  ARP_OPERATION_LABELS,
  BROADCAST_MAC,
  type ArpBuildInput,
  buildArp,
  buildLayout,
  formatHardwareAddress,
  formatProtocolAddress,
  parseArp,
} from './utils/arp';
import styles from './index.module.css';

/**
 * ARP 报文解析与构造器：以太网 + IPv4 场景的 28 字节 RFC 826 报文双向编解码，
 * 提供字段布局视图与长度 / 类型 / 操作码校验提示。
 */
const ArpPacketCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<'parse' | 'build'>('parse');
  const [input, setInput] = React.useState<string>(defaultInput ?? SAMPLE_ARP_REQUEST);
  const [buildInput, setBuildInput] = React.useState<ArpBuildInput>(DEFAULT_BUILD);

  const parsed = React.useMemo(() => (mode === 'parse' ? parseArp(input) : undefined), [mode, input]);
  const built = React.useMemo(() => (mode === 'build' ? buildArp(buildInput) : undefined), [mode, buildInput]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const setField = <K extends keyof ArpBuildInput>(key: K, value: ArpBuildInput[K]) => {
    setBuildInput((previous) => ({ ...previous, [key]: value }));
  };

  const packet = parsed?.packet;
  const layout = packet ? buildLayout(packet) : [];
  const isBroadcastTarget = packet
    ? formatHardwareAddress(packet.targetHardware) === BROADCAST_MAC
    : false;

  return (
    <div className={styles.container}>
      <Card title="模式与输入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.field}>
            <label>操作</label>
            <Radio.Group value={mode} onChange={(event) => setMode(event.target.value)}>
              <Radio.Button value="parse">解析报文</Radio.Button>
              <Radio.Button value="build">构造报文</Radio.Button>
            </Radio.Group>
          </div>

          {mode === 'parse' ? (
            <div className={styles.field}>
              <label>十六进制 ARP 报文（28 字节，不含以太网帧头）</label>
              <Input.TextArea
                className={styles.mono}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                autoSize={{ minRows: 4, maxRows: 10 }}
                placeholder="例如 00 01 08 00 06 04 00 01 ..."
              />
              <div className={styles.samples}>
                {SAMPLE_ARP_HEX.map((sample, index) => (
                  <Tag
                    key={sample}
                    className={styles.mono}
                    onClick={() => setInput(sample)}
                  >
                    {index === 0 ? 'ARP 请求' : 'ARP 应答'}
                  </Tag>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>操作码</label>
                <Select<number>
                  value={buildInput.operation}
                  onChange={(value) => setField('operation', value)}
                  options={[
                    { value: 1, label: ARP_OPERATION_LABELS[1]! },
                    { value: 2, label: ARP_OPERATION_LABELS[2]! },
                  ]}
                  style={{ width: '100%' }}
                />
              </div>
              <div className={styles.field}>
                <label>发送方 MAC</label>
                <Input
                  className={styles.mono}
                  value={buildInput.senderMac}
                  onChange={(event) => setField('senderMac', event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>发送方 IP</label>
                <Input
                  className={styles.mono}
                  value={buildInput.senderIp}
                  onChange={(event) => setField('senderIp', event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>目标 MAC（请求通常为广播）</label>
                <Input
                  className={styles.mono}
                  value={buildInput.targetMac}
                  onChange={(event) => setField('targetMac', event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>目标 IP</label>
                <Input
                  className={styles.mono}
                  value={buildInput.targetIp}
                  onChange={(event) => setField('targetIp', event.target.value)}
                />
              </div>
            </div>
          )}
        </Space>
      </Card>

      {mode === 'parse' ? (
        parsed && !parsed.ok ? (
          <Alert type="error" showIcon message="解析失败" description={parsed.error} />
        ) : packet ? (
          <Card
            title="解析结果"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(packet.raw
                  .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
                  .join(' '))}
              >
                复制报文
              </Button>
            }
          >
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <span className={styles.label}>操作码</span>
                <span className={styles.value}>
                  {packet.operation} · {ARP_OPERATION_LABELS[packet.operation] ?? '未知'}
                </span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.label}>发送方</span>
                <span className={`${styles.value} ${styles.mono}`}>
                  {formatHardwareAddress(packet.senderHardware)} /{' '}
                  {formatProtocolAddress(packet.senderProtocol)}
                </span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.label}>目标方</span>
                <span className={`${styles.value} ${styles.mono}`}>
                  {formatHardwareAddress(packet.targetHardware)} /{' '}
                  {formatProtocolAddress(packet.targetProtocol)}
                </span>
              </div>
            </div>

            {isBroadcastTarget ? (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message="目标 MAC 为广播地址 FF:FF:FF:FF:FF:FF，表示该请求发往链路上的所有主机"
              />
            ) : null}
            {parsed!.warnings.map((warning) => (
              <Alert
                key={warning}
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message={warning}
              />
            ))}

            <div className={styles.layout}>
              <div className={styles.layoutHeader}>
                <span>偏移</span>
                <span>长度</span>
                <span>字段</span>
                <span>值</span>
              </div>
              {layout.map((row) => (
                <div key={`${row.offset}-${row.name}`} className={styles.layoutRow}>
                  <span className={styles.mono}>{row.offset}</span>
                  <span className={styles.mono}>{row.length}</span>
                  <span>{row.name}</span>
                  <span className={styles.mono}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : undefined
      ) : built && !built.ok ? (
        <Alert type="error" showIcon message="构造失败" description={built.error} />
      ) : built ? (
        <Card
          title="构造结果（28 字节）"
          extra={
            <Space>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(built.hex ?? '')}
              >
                复制空格分隔
              </Button>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(built.compact ?? '')}
              >
                复制连续十六进制
              </Button>
            </Space>
          }
        >
          {built.warnings.map((warning) => (
            <Alert
              key={warning}
              style={{ marginBottom: 12 }}
              type="info"
              showIcon
              message={warning}
            />
          ))}
          <div className={styles.byteGrid}>
            {built.bytes!.map((byte, index) => (
              <span key={index} className={styles.byteCell}>
                {byte.toString(16).toUpperCase().padStart(2, '0')}
              </span>
            ))}
          </div>
          <span className={`${styles.mono} ${styles.hexLine}`}>{built.hex}</span>
          <div className={styles.hint}>
            字节布局：硬件类型(2) · 协议类型(2) · HLEN(1) · PLEN(1) · 操作码(2) ·
            发送方 MAC(6) · 发送方 IP(4) · 目标 MAC(6) · 目标 IP(4)
          </div>
        </Card>
      ) : undefined}

      {mode === 'parse' && packet ? (
        <Button
          icon={<SwapOutlined />}
          onClick={() => {
            setBuildInput({
              operation: packet.operation,
              senderMac: formatHardwareAddress(packet.senderHardware),
              senderIp: formatProtocolAddress(packet.senderProtocol),
              targetMac: formatHardwareAddress(packet.targetHardware),
              targetIp: formatProtocolAddress(packet.targetProtocol),
            });
            setMode('build');
          }}
        >
          用解析结果填充构造器
        </Button>
      ) : null}

      <Alert
        type="info"
        showIcon
        message="协议说明"
        description={
          <div className={styles.hint}>
            <p>
              ARP（RFC 826）在以太网 + IPv4 场景下固定为 28 字节：硬件类型 1、协议类型 0x0800、
              HLEN 6、PLEN 4。请求（who-has）把目标 MAC 置零并使用广播 MAC
              <span className={styles.mono}> FF:FF:FF:FF:FF:FF</span>；应答（is-at）回填双方地址。
            </p>
            <p>
              本工具只处理 ARP 报文体，不解析外层以太网帧头；当 HLEN / PLEN / 协议类型与以太网 IPv4
              约定不一致时，会按字段实际长度解析并给出告警。所有计算在浏览器本地完成。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default ArpPacketCodec;
