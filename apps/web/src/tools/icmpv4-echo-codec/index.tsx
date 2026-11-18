'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  Tabs,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  ICMP_TYPE_ECHO_REPLY,
  ICMP_TYPE_ECHO_REQUEST,
  buildIcmpPacket,
  decodeTextPayload,
  encodeTextPayload,
  formatHex,
  normalizeHexInput,
  parseIcmpPacket,
  type IcmpEchoType,
} from './utils/icmp';
import { DEFAULT_IDENTIFIER, DEFAULT_PAYLOAD_TEXT, DEFAULT_SEQUENCE, SAMPLE_PACKET_HEX } from './constants';
import styles from './index.module.css';

interface BuildFormState {
  type: IcmpEchoType;
  identifier: number;
  sequence: number;
  payloadText: string;
}

/** 构建面板：字段 → 完整 ICMP 报文 hex */
const BuildPanel: React.FC = () => {
  const [form, setForm] = React.useState<BuildFormState>({
    type: ICMP_TYPE_ECHO_REQUEST,
    identifier: DEFAULT_IDENTIFIER,
    sequence: DEFAULT_SEQUENCE,
    payloadText: DEFAULT_PAYLOAD_TEXT,
  });
  const [hex, setHex] = React.useState('');

  const update = <K extends keyof BuildFormState>(key: K, value: BuildFormState[K]): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleBuild = (): void => {
    try {
      const packet = buildIcmpPacket({
        type: form.type,
        identifier: form.identifier,
        sequence: form.sequence,
        data: encodeTextPayload(form.payloadText),
      });
      setHex(formatHex(packet));
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Form layout="vertical">
        <Form.Item label="Type 类型">
          <Radio.Group
            value={form.type}
            onChange={(event) => update('type', event.target.value as IcmpEchoType)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value={ICMP_TYPE_ECHO_REQUEST}>8 Echo Request（ping 请求）</Radio.Button>
            <Radio.Button value={ICMP_TYPE_ECHO_REPLY}>0 Echo Reply（ping 应答）</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Space wrap size="middle" style={{ display: 'flex' }}>
          <Form.Item label="Identifier 标识符（0–65535）" style={{ minWidth: 220 }}>
            <InputNumber
              value={form.identifier}
              min={0}
              max={0xffff}
              style={{ width: '100%' }}
              onChange={(value) => update('identifier', value ?? 0)}
            />
          </Form.Item>
          <Form.Item label="Sequence Number 序列号（0–65535）" style={{ minWidth: 220 }}>
            <InputNumber
              value={form.sequence}
              min={0}
              max={0xffff}
              style={{ width: '100%' }}
              onChange={(value) => update('sequence', value ?? 0)}
            />
          </Form.Item>
        </Space>
        <Form.Item label="Data payload（按 UTF-8 编码，可留空）">
          <Input.TextArea
            value={form.payloadText}
            autoSize={{ minRows: 3, maxRows: 8 }}
            spellCheck={false}
            className={styles.mono}
            onChange={(event) => update('payloadText', event.target.value)}
          />
        </Form.Item>
      </Form>
      <Space>
        <Button type="primary" onClick={handleBuild}>
          构建 ICMP 报文
        </Button>
        {hex && (
          <Button icon={<CopyOutlined />} onClick={() => void copyToClipboard(hex).then(() => message.success('报文 hex 已复制'))}>
            复制 hex
          </Button>
        )}
      </Space>
      {hex && (
        <>
          <Alert type="success" showIcon message="已按 RFC 792 大端布局组包，RFC 1071 校验和自动回填到偏移 2–3" />
          <Input.TextArea value={hex} readOnly autoSize={{ minRows: 4, maxRows: 10 }} className={styles.hex} />
        </>
      )}
    </Space>
  );
};

/** 解析面板：抓包 hex → 结构化字段 + 校验和核对 */
const ParsePanel: React.FC = () => {
  const [raw, setRaw] = React.useState(SAMPLE_PACKET_HEX);

  const output = React.useMemo(() => {
    if (!raw.trim()) {
      return { packet: null, error: '' };
    }
    try {
      return { packet: parseIcmpPacket(normalizeHexInput(raw)), error: '' };
    } catch (error) {
      return { packet: null, error: (error as Error).message };
    }
  }, [raw]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 6, maxRows: 12 }}
        spellCheck={false}
        className={styles.hex}
        placeholder="粘贴抓包得到的 ICMP 报文 hex（支持空格 / 冒号 / 逗号 / 0x 前缀）"
      />
      {output.error ? (
        <Alert type="error" showIcon message={output.error} />
      ) : (
        output.packet && (
          <>
            <Alert
              type={output.packet.checksumValid ? 'success' : 'error'}
              showIcon
              message={
                output.packet.checksumValid
                  ? `校验和核对通过：报文 0x${output.packet.checksum
                      .toString(16)
                      .toUpperCase()
                      .padStart(4, '0')} 与重算值一致`
                  : `校验和核对失败：报文携带 0x${output.packet.checksum
                      .toString(16)
                      .toUpperCase()
                      .padStart(4, '0')}，重算为 0x${output.packet.recomputedChecksum
                      .toString(16)
                      .toUpperCase()
                      .padStart(4, '0')}`
              }
            />
            {output.packet.warnings.map((warning) => (
              <Alert key={warning} type="warning" showIcon message={warning} />
            ))}
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Type">
                {output.packet.type}
                {output.packet.type === ICMP_TYPE_ECHO_REQUEST && '（Echo Request）'}
                {output.packet.type === ICMP_TYPE_ECHO_REPLY && '（Echo Reply）'}
              </Descriptions.Item>
              <Descriptions.Item label="Code">{output.packet.code}</Descriptions.Item>
              <Descriptions.Item label="Identifier">
                {output.packet.identifier}（0x
                {output.packet.identifier.toString(16).toUpperCase().padStart(4, '0')}）
              </Descriptions.Item>
              <Descriptions.Item label="Sequence Number">
                {output.packet.sequence}（0x
                {output.packet.sequence.toString(16).toUpperCase().padStart(4, '0')}）
              </Descriptions.Item>
              <Descriptions.Item label={`Data（${output.packet.data.length} 字节，UTF-8 预览）`}>
                {output.packet.data.length > 0 ? decodeTextPayload(output.packet.data) : '—（空 payload）'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )
      )}
    </Space>
  );
};

/**
 * ICMPv4 Echo 报文编解码器：按 RFC 792 完成 Type/Code/Checksum/Identifier/
 * Sequence/Data 的组包与拆包，校验和遵循 RFC 1071，全部在浏览器本地运算。
 *
 * @param _props - 工具组件属性
 * @returns 工具交互界面
 */
const Icmpv4EchoCodec: React.FC<ToolComponentProps> = (_props) => {
  React.useEffect(() => {
    message.info('报文构建与校验和核对均在本地完成，不发送任何网络数据包');
  }, []);

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">RFC 792 ICMPv4 Echo：8 字节大端首部 + payload，RFC 1071 反码求和校验</Tag>
          <Tabs
            items={[
              { key: 'build', label: '字段 → 报文', children: <BuildPanel /> },
              { key: 'parse', label: '报文 → 字段', children: <ParsePanel /> },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

export default Icmpv4EchoCodec;
