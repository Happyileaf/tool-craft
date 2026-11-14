'use client';

import React from 'react';
import { Alert, Button, Card, Descriptions, Input, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  buildEthernetFrame,
  parseEthernetFrame,
  type EthernetBuildConfig,
} from './utils/ethernet';
import {
  DEFAULT_FRAME_HEX,
  ETHER_TYPE_PRESETS,
  FRAME_PLACEHOLDER,
  SAMPLE_PAYLOAD_HEX,
} from './constants';
import styles from './index.module.css';

/** 把 0x0800 或十进制字符串转为数字 */
const parseNumber = (input: string): number => {
  const text = input.trim();
  if (!text) {
    return NaN;
  }
  return text.toLowerCase().startsWith('0x') ? parseInt(text.slice(2), 16) : Number(text);
};

/**
 * 以太网 II 帧解析、FCS 校验与构造器，所有字节运算在浏览器本地完成
 */
const EthernetFrameCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_FRAME_HEX);
  const [destination, setDestination] = React.useState('02:00:00:00:00:01');
  const [source, setSource] = React.useState('02:00:00:00:00:02');
  const [etherType, setEtherType] = React.useState('0x0800');
  const [payloadHex, setPayloadHex] = React.useState(SAMPLE_PAYLOAD_HEX);

  const parsed = React.useMemo(() => {
    try {
      return { frame: parseEthernetFrame(hexInput), error: null as string | null };
    } catch (caught) {
      return { frame: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput]);

  const built = React.useMemo(() => {
    const config: EthernetBuildConfig = {
      destination,
      source,
      etherType: parseNumber(etherType),
      payloadHex,
    };
    try {
      return { output: buildEthernetFrame(config), error: null as string | null };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '构造失败' };
    }
  }, [destination, source, etherType, payloadHex]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const resetBuilder = (): void => {
    setDestination('02:00:00:00:00:01');
    setSource('02:00:00:00:00:02');
    setEtherType('0x0800');
    setPayloadHex(SAMPLE_PAYLOAD_HEX);
  };

  const frame = parsed.frame;

  return (
    <div className={styles.container}>
      <Card title="以太网 II 帧解析与 FCS 校验">
        <span className={styles.label}>帧十六进制（可含末尾 4 字节 FCS）</span>
        <Input.TextArea
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          rows={5}
          className={styles.inputArea}
          placeholder={FRAME_PLACEHOLDER}
        />
        <Space wrap style={{ margin: '10px 0' }}>
          <Button icon={<ReloadOutlined />} onClick={() => setHexInput(DEFAULT_FRAME_HEX)}>
            载入合法示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setHexInput('')}>
            清空
          </Button>
        </Space>

        {parsed.error ? (
          <Alert type="error" showIcon message="解析失败" description={parsed.error} />
        ) : (
          frame && (
            <div className={styles.resultCard}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="目的 MAC">{frame.destinationMac}</Descriptions.Item>
                <Descriptions.Item label="源 MAC">{frame.sourceMac}</Descriptions.Item>
                <Descriptions.Item label="EtherType">
                  0x{frame.etherType.toString(16).padStart(4, '0')}（{frame.etherTypeName}）
                </Descriptions.Item>
                <Descriptions.Item label="帧长度">{frame.frameLength} 字节</Descriptions.Item>
                <Descriptions.Item label="载荷长度">{frame.payloadLength} 字节</Descriptions.Item>
                <Descriptions.Item label="FCS 校验">
                  {frame.fcsHex && frame.fcsValid ? (
                    <Tag color="green">通过（{frame.fcsHex}）</Tag>
                  ) : (
                    <Tag color="orange">
                      未检测到有效 FCS（重算 CRC-32 = 0x{frame.computedFcs.toString(16).padStart(8, '0')}）
                    </Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>载荷（每 16 字节一组）</span>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(frame.payloadHex)}>
                    复制
                  </Button>
                </div>
                <code className={styles.hexText}>{frame.payloadHex || '（空）'}</code>
              </div>

              {frame.warnings.length > 0 && (
                <Alert
                  type={frame.fcsValid ? 'info' : 'warning'}
                  showIcon
                  message="链路层提示"
                  description={
                    <ul className={styles.warningList}>
                      {frame.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  }
                />
              )}
            </div>
          )
        )}
      </Card>

      <Card title="以太网 II 帧构造器（自动计算 FCS）">
        <Space wrap size="middle" style={{ marginBottom: 10 }}>
          <div>
            <span className={styles.label}>目的 MAC</span>
            <Input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className={styles.monoInput}
              style={{ width: 190 }}
            />
          </div>
          <div>
            <span className={styles.label}>源 MAC</span>
            <Input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className={styles.monoInput}
              style={{ width: 190 }}
            />
          </div>
          <div>
            <span className={styles.label}>EtherType（0x 或十进制）</span>
            <Input
              value={etherType}
              onChange={(event) => setEtherType(event.target.value)}
              className={styles.monoInput}
              style={{ width: 150 }}
            />
          </div>
        </Space>
        <Space wrap size="small" style={{ marginBottom: 8 }}>
          {ETHER_TYPE_PRESETS.map((preset) => (
            <Button key={preset.value} size="small" onClick={() => setEtherType(preset.value)}>
              {preset.label}
            </Button>
          ))}
        </Space>

        <span className={styles.label}>载荷十六进制（1–1500 字节）</span>
        <Input.TextArea
          value={payloadHex}
          onChange={(event) => setPayloadHex(event.target.value)}
          rows={4}
          className={styles.inputArea}
        />
        <Space wrap style={{ margin: '10px 0' }}>
          <Button icon={<ReloadOutlined />} onClick={resetBuilder}>
            重置示例
          </Button>
        </Space>

        {built.error ? (
          <Alert type="error" showIcon message="构造失败" description={built.error} />
        ) : (
          built.output && (
            <div className={styles.hexBlock}>
              <div className={styles.hexHeader}>
                <span>
                  完整帧 {built.output.bytes.length} 字节（FCS = 0x
                  {built.output.fcs.toString(16).padStart(8, '0')}）
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
        message="字段与 FCS 说明"
        description={
          <div className={styles.hint}>
            <p>
              以太网 II 帧固定头部为 14 字节：6 字节目的 MAC、6 字节源 MAC 与 2 字节 EtherType。
              EtherType ≥ 0x0600 时表示上层协议（如 0x0800 = IPv4、0x0806 = ARP），小于该值的历史
              取值表示长度字段（IEEE 802.3）。标准帧含 FCS 为 64–1518 字节，载荷 46–1500 字节。
            </p>
            <p>
              FCS 使用 CRC-32/IEEE 802.3（反射多项式 0xEDB88320，初值与结果异或均为
              0xFFFFFFFF），覆盖从目的 MAC 到载荷末尾的全部字节。工具会自动识别并剥离输入末尾
              匹配的 4 字节 FCS；构造时自动追加正确 FCS。所有计算均在本机浏览器完成。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default EthernetFrameCodec;
