'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Tabs, Tag, message } from 'antd';
import { EXAMPLE_MACS, PARSE_DEMO_MAC } from './constants';
import {
  buildMagicPacket,
  formatMac,
  fromHex,
  parseMac,
  parseMagicPacket,
  toHex,
  MAGIC_PACKET_LENGTH,
} from './utils/wol';
import styles from './index.module.css';

const { TextArea } = Input;

/** 构造方向的展示结果 */
interface BuildResult {
  packet: Uint8Array;
  mac: string;
  hexCompact: string;
  hexSpaced: string;
}

/** 解析方向的展示结果 */
interface ParseResultView {
  targetMac: string;
  syncStream: string;
  repetitionCount: number;
  length: number;
}

/**
 * Wake-on-LAN 魔术包构造器：
 * 构造方向把 MAC 转为 102 字节 AMD 魔术包；解析方向校验十六进制魔术包并还原目标 MAC。
 *
 * @returns 魔术包构造 / 解析双向界面
 */
const WakeOnLanMagicPacket: React.FC<ToolComponentProps> = () => {
  const [macInput, setMacInput] = React.useState('AA:BB:CC:DD:EE:FF');
  const [hexInput, setHexInput] = React.useState('');

  /** 构造结果（含错误信息） */
  const buildOutcome = React.useMemo<{ result?: BuildResult; error?: string }>(() => {
    if (macInput.trim() === '') return {};
    try {
      const macBytes = parseMac(macInput);
      const packet = buildMagicPacket(macInput);
      return {
        result: {
          packet,
          mac: formatMac(macBytes),
          hexCompact: toHex(packet),
          hexSpaced: toHex(packet, { separator: ' ' }),
        },
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [macInput]);

  /** 解析结果（含错误信息） */
  const parseOutcome = React.useMemo<{ result?: ParseResultView; error?: string }>(() => {
    if (hexInput.trim() === '') return {};
    try {
      const bytes = fromHex(hexInput);
      const parsed = parseMagicPacket(bytes);
      return {
        result: {
          targetMac: parsed.targetMac,
          syncStream: toHex(parsed.syncStream, { separator: ' ' }),
          repetitionCount: parsed.repetitions.length,
          length: parsed.length,
        },
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [hexInput]);

  const copyText = (text: string, label: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label}已复制`))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const builderTab = (
    <div>
      <p className={styles.hint}>
        输入目标网卡 MAC 地址，生成 AMD Wake-on-LAN 魔术包：6 字节 0xFF 同步流 + 16 次 MAC 重复，共
        {MAGIC_PACKET_LENGTH} 字节。全部计算在本地完成，不会发送任何网络报文。
      </p>
      <div className={styles.fieldLabel}>目标 MAC 地址</div>
      <Input
        placeholder="例如 AA:BB:CC:DD:EE:FF（支持 : - . 分隔符与无分隔符写法）"
        value={macInput}
        onChange={(event) => setMacInput(event.target.value)}
        allowClear
      />
      <Space wrap style={{ marginTop: 12 }}>
        <span className={styles.hint}>示例：</span>
        {EXAMPLE_MACS.map((example) => (
          <Button key={example.name} size="small" onClick={() => setMacInput(example.mac)}>
            {example.name}
          </Button>
        ))}
      </Space>

      {buildOutcome.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="无法构造魔术包" description={buildOutcome.error} />
      ) : null}

      {buildOutcome.result ? (
        <div style={{ marginTop: 16 }}>
          <Space wrap>
            <Tag color="green">目标 MAC：{buildOutcome.result.mac}</Tag>
            <Tag>帧长度：{MAGIC_PACKET_LENGTH} 字节</Tag>
            <Button size="small" onClick={() => copyText(buildOutcome.result!.hexCompact, '紧凑十六进制')}>
              复制紧凑 HEX
            </Button>
            <Button size="small" onClick={() => copyText(buildOutcome.result!.hexSpaced, '带空格十六进制')}>
              复制带空格 HEX
            </Button>
          </Space>
          <pre className={styles.hexBlock}>{buildOutcome.result.hexSpaced}</pre>
        </div>
      ) : null}
    </div>
  );

  const parserTab = (
    <div>
      <p className={styles.hint}>
        粘贴魔术包十六进制文本（允许空格、换行与 0x 前缀），校验帧结构并还原目标 MAC 地址。
      </p>
      <div className={styles.fieldLabel}>魔术包十六进制</div>
      <TextArea
        rows={6}
        placeholder="粘贴 102 字节（204 个十六进制字符）的魔术包…"
        value={hexInput}
        onChange={(event) => setHexInput(event.target.value)}
      />
      <Space style={{ marginTop: 12 }}>
        <Button
          size="small"
          onClick={() => setHexInput(toHex(buildMagicPacket(PARSE_DEMO_MAC), { separator: ' ' }))}
        >
          填入示例包
        </Button>
        <Button size="small" onClick={() => setHexInput('')}>
          清空
        </Button>
      </Space>

      {parseOutcome.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="魔术包校验失败" description={parseOutcome.error} />
      ) : null}

      {parseOutcome.result ? (
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statName}>目标 MAC</div>
            <div className={styles.statValue}>{parseOutcome.result.targetMac}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statName}>同步流</div>
            <div className={styles.statValue}>{parseOutcome.result.syncStream}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statName}>MAC 重复次数 / 帧长</div>
            <div className={styles.statValue}>
              {parseOutcome.result.repetitionCount} 次 / {parseOutcome.result.length} 字节
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="Wake-on-LAN 魔术包构造器（含反向校验解析）">
        <Tabs
          items={[
            { key: 'build', label: '构造魔术包', children: builderTab },
            { key: 'parse', label: '校验 / 解析', children: parserTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default WakeOnLanMagicPacket;
