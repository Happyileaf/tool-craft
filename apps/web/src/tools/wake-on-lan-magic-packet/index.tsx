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
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_MAC, INPUT_FORMAT_OPTIONS, MODE_OPTIONS, WOL_PORTS } from './constants';
import styles from './index.module.css';
import {
  MAGIC_PACKET_SIZE,
  WolError,
  base64ToBytes,
  buildMagicPacket,
  bytesToBase64,
  bytesToHex,
  hexToBytes,
  parseMagicPacket,
} from './utils/wol';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

type Mode = 'build' | 'parse';
type InputFormat = 'hex' | 'base64';

export default function WakeOnLanMagicPacketTool(_props: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('build');
  const [macInput, setMacInput] = useState(DEFAULT_MAC);
  const [spacedHex, setSpacedHex] = useState(false);
  const [port, setPort] = useState(9);
  const [parseFormat, setParseFormat] = useState<InputFormat>('hex');
  const [parseInput, setParseInput] = useState('');

  const buildResult = useMemo<
    | { ok: true; bytes: Uint8Array; hex: string; base64: string }
    | { ok: false; error: string }
    | null
  >(() => {
    if (mode !== 'build' || !macInput.trim()) {
      return null;
    }
    try {
      const bytes = buildMagicPacket(macInput);
      return {
        ok: true,
        bytes,
        hex: bytesToHex(bytes, spacedHex),
        base64: bytesToBase64(bytes),
      };
    } catch (error) {
      return { ok: false, error: error instanceof WolError ? error.message : '构造失败' };
    }
  }, [mode, macInput, spacedHex]);

  const parseResult = useMemo(() => {
    if (mode !== 'parse' || !parseInput.trim()) {
      return null;
    }
    try {
      const raw = parseFormat === 'hex' ? hexToBytes(parseInput) : base64ToBytes(parseInput);
      const parsed = parseMagicPacket(raw);
      return { ok: true as const, ...parsed };
    } catch (error) {
      return { ok: false as const, error: error instanceof WolError ? error.message : '解析失败' };
    }
  }, [mode, parseFormat, parseInput]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      message.success(`${label}已复制`);
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const handleFillExample = () => {
    try {
      setParseFormat('hex');
      setParseInput(bytesToHex(buildMagicPacket(DEFAULT_MAC)));
    } catch {
      message.error('示例生成失败');
    }
  };

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={MODE_OPTIONS}
      />

      {mode === 'build' ? (
        <>
          <Card size="small" title="目标设备 MAC 地址">
            <Space direction="vertical" className="w-full" size={8}>
              <Input
                value={macInput}
                onChange={(event) => setMacInput(event.target.value)}
                placeholder="例如 AA:BB:CC:DD:EE:FF"
                className={styles.monoInput}
                allowClear
              />
              <Text type="secondary" className={styles.hint}>
                自动兼容冒号（aa:bb:cc:dd:ee:ff）、连字符（aa-bb-...）、Cisco 点分（aabb.ccdd.eeff）与无分隔符写法。
              </Text>
              <Space wrap>
                <Button size="small" onClick={() => setMacInput(DEFAULT_MAC)}>
                  填充示例
                </Button>
                <Radio
                  checked={spacedHex}
                  onChange={(event) => setSpacedHex(event.target.checked)}
                >
                  HEX 按字节空格分组
                </Radio>
                <Select
                  size="small"
                  value={port}
                  onChange={setPort}
                  options={WOL_PORTS}
                  style={{ width: 260 }}
                />
              </Space>
            </Space>
          </Card>

          {buildResult && !buildResult.ok ? (
            <Alert type="error" showIcon message="构造失败" description={buildResult.error} />
          ) : null}

          {buildResult && buildResult.ok ? (
            <Card size="small" title={<Space><ThunderboltOutlined />魔术包输出（固定 102 字节）</Space>}>
              <Space direction="vertical" className="w-full" size={12}>
                <div className={styles.hexBlock}>
                  <div className={styles.hexHeader}>
                    <span>十六进制 HEX（{MAGIC_PACKET_SIZE} 字节 / {buildResult.hex.replace(/\s/g, '').length} 字符）</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(buildResult.hex, 'HEX')}
                    >
                      复制
                    </Button>
                  </div>
                  <div className={styles.hexText}>{buildResult.hex}</div>
                </div>
                <div className={styles.hexBlock}>
                  <div className={styles.hexHeader}>
                    <span>Base64（{buildResult.base64.length} 字符）</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(buildResult.base64, 'Base64')}
                    >
                      复制
                    </Button>
                  </div>
                  <div className={styles.hexText}>{buildResult.base64}</div>
                </div>
                <Alert
                  type="info"
                  showIcon
                  message="UDP 承载说明"
                  description={
                    <Paragraph className="!mb-0" style={{ fontSize: 13 }}>
                      魔术包通常封装在 UDP 数据报中，发往端口 <Tag>{port}</Tag>
                      ，目标地址建议使用子网定向广播（如 192.168.1.255 / 255.255.255.255）。
                      本工具仅在本地完成字节构造，不实际发送任何数据包。
                    </Paragraph>
                  }
                />
              </Space>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Card size="small" title="粘贴待校验的魔术包">
            <Space direction="vertical" className="w-full" size={8}>
              <Radio.Group
                value={parseFormat}
                onChange={(event) => setParseFormat(event.target.value as InputFormat)}
                optionType="button"
                options={INPUT_FORMAT_OPTIONS}
              />
              <TextArea
                value={parseInput}
                onChange={(event) => setParseInput(event.target.value)}
                rows={6}
                placeholder={parseFormat === 'hex' ? '粘贴 102 字节魔术包的十六进制文本…' : '粘贴魔术包的 Base64 文本…'}
                className={styles.inputArea}
              />
              <Button size="small" onClick={handleFillExample}>
                填充合法示例
              </Button>
            </Space>
          </Card>

          {parseResult && !parseResult.ok ? (
            <Alert type="error" showIcon message="校验失败" description={parseResult.error} />
          ) : null}

          {parseResult && parseResult.ok ? (
            <Card size="small" title="解析结果">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="校验结论">
                  <Tag color="success">合法魔术包</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="目标 MAC">
                  <Text code>{parseResult.targetMac}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="报文长度">{parseResult.bytes.length} 字节</Descriptions.Item>
                <Descriptions.Item label="结构">
                  6 字节 0xFF 同步流 + 目标 MAC 重复 16 次
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ) : null}
        </>
      )}

      <Title level={5} className="!mb-0">工作原理</Title>
      <Text type="secondary" className={styles.hint}>
        AMD Magic Packet 以 6 字节 0xFF 同步流开头，后接目标网卡 MAC 地址连续重复 16 次，总长固定 102 字节。
        网卡启用 WoL 且处于待机供电时识别该帧并触发开机；全部计算均在浏览器本地完成。
      </Text>
    </div>
  );
}
