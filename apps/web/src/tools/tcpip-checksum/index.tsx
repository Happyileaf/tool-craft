'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  TCP_CHECKSUM_OFFSET,
  UDP_CHECKSUM_OFFSET,
  applyChecksum,
  generateChecksum,
  parseHexBytes,
  parseIpv4,
  toHex,
  verifySegment,
  type ChecksumProtocol,
} from './utils/checksum';
import {
  DEFAULT_DST_IP,
  DEFAULT_RAW_HEX,
  DEFAULT_RAW_OFFSET,
  DEFAULT_SRC_IP,
  DEFAULT_TCP_HEX,
  DEFAULT_UDP_HEX,
  PROTOCOL_OPTIONS,
} from './constants';
import styles from './index.module.css';

const DEFAULT_HEX_BY_PROTOCOL: Record<ChecksumProtocol, string> = {
  raw: DEFAULT_RAW_HEX,
  tcp: DEFAULT_TCP_HEX,
  udp: DEFAULT_UDP_HEX,
};

interface ParseState {
  bytes: number[];
  srcIp: number[];
  dstIp: number[];
  error: string | null;
}

/**
 * TCP/IP 互联网校验和工具：按 RFC 1071 计算 / 校验 IPv4 首部、ICMP、
 * TCP、UDP 报文的 16 位反码校验和；TCP / UDP 自动拼接伪首部，
 * 全部在浏览器本地完成
 *
 * @returns 校验和计算与校验界面
 */
const TcpipChecksum: React.FC<ToolComponentProps> = () => {
  const [protocol, setProtocol] = React.useState<ChecksumProtocol>('raw');
  const [hexInput, setHexInput] = React.useState<string>(DEFAULT_RAW_HEX);
  const [srcIpText, setSrcIpText] = React.useState<string>(DEFAULT_SRC_IP);
  const [dstIpText, setDstIpText] = React.useState<string>(DEFAULT_DST_IP);
  const [rawOffset, setRawOffset] = React.useState<number>(DEFAULT_RAW_OFFSET);

  const state: ParseState = React.useMemo(() => {
    try {
      const bytes = parseHexBytes(hexInput);
      if (protocol === 'raw') {
        return { bytes, srcIp: [], dstIp: [], error: null };
      }
      return {
        bytes,
        srcIp: parseIpv4(srcIpText),
        dstIp: parseIpv4(dstIpText),
        error: null,
      };
    } catch (caught) {
      return {
        bytes: [],
        srcIp: [],
        dstIp: [],
        error: caught instanceof Error ? caught.message : '输入解析失败',
      };
    }
  }, [hexInput, protocol, srcIpText, dstIpText]);

  const result = React.useMemo<{
    checksum: number;
    filled: number[];
    valid: boolean;
  } | { error: string } | null>(() => {
    if (state.error || state.bytes.length === 0) {
      return null;
    }
    try {
      const checksum = generateChecksum(state.bytes, protocol, state.srcIp, state.dstIp);
      const checksumOffset =
        protocol === 'tcp'
          ? TCP_CHECKSUM_OFFSET
          : protocol === 'udp'
            ? UDP_CHECKSUM_OFFSET
            : rawOffset;
      const filled = applyChecksum(state.bytes, checksumOffset, checksum);
      const valid = verifySegment(filled, protocol, state.srcIp, state.dstIp);
      return { checksum, filled, valid };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [state, protocol, rawOffset]);

  const switchProtocol = (value: ChecksumProtocol) => {
    setProtocol(value);
    setHexInput(DEFAULT_HEX_BY_PROTOCOL[value]);
  };

  const copy = async (value: string) => {
    await copyToClipboard(value);
    message.success('已复制到剪贴板');
  };

  const okResult = result && 'checksum' in result ? result : null;
  const checksumHex = okResult ? okResult.checksum.toString(16).toUpperCase().padStart(4, '0') : null;
  const filledHex = okResult ? toHex(okResult.filled) : null;

  return (
    <div className={styles.container}>
      <Card title="TCP/IP 互联网校验和（RFC 1071）">
        <Radio.Group
          value={protocol}
          onChange={(event) => switchProtocol(event.target.value as ChecksumProtocol)}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
          options={PROTOCOL_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
        />
        <div className={styles.formColumn}>
          <span className={styles.label}>十六进制报文（校验和字段可留任意值，计算时会自动清零）</span>
          <Input.TextArea
            className={styles.inputArea}
            value={hexInput}
            onChange={(event) => setHexInput(event.target.value)}
            placeholder="十六进制字节，支持空格 / 逗号分隔与 0x 前缀，如 45 00 00 3c"
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
          <Space wrap>
            <Tag color="blue">{state.bytes.length} 字节</Tag>
            {protocol === 'tcp' && <Tag color="geekblue">校验和偏移 16</Tag>}
            {protocol === 'udp' && <Tag color="geekblue">校验和偏移 6</Tag>}
          </Space>
        </div>

        {protocol !== 'raw' ? (
          <div className={styles.addressRow}>
            <div className={styles.addressItem}>
              <span className={styles.label}>源 IPv4 地址</span>
              <Input value={srcIpText} onChange={(event) => setSrcIpText(event.target.value)} placeholder="192.168.1.2" />
            </div>
            <div className={styles.addressItem}>
              <span className={styles.label}>目的 IPv4 地址</span>
              <Input value={dstIpText} onChange={(event) => setDstIpText(event.target.value)} placeholder="192.168.1.1" />
            </div>
          </div>
        ) : (
          <div className={styles.formColumn}>
            <span className={styles.label}>校验和字段偏移（IPv4 首部为 10，ICMP 视具体报文而定）</span>
            <Input
              type="number"
              value={rawOffset}
              onChange={(event) => setRawOffset(Number(event.target.value))}
              style={{ width: 160 }}
            />
          </div>
        )}

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setHexInput(DEFAULT_HEX_BY_PROTOCOL[protocol]);
              setSrcIpText(DEFAULT_SRC_IP);
              setDstIpText(DEFAULT_DST_IP);
              setRawOffset(DEFAULT_RAW_OFFSET);
            }}
          >
            载入示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setHexInput('');
            }}
          >
            清空
          </Button>
        </Space>

        {state.error ? <Alert type="error" showIcon message={state.error} style={{ marginTop: 12 }} /> : null}
        {result && 'error' in result ? (
          <Alert type="error" showIcon message={result.error} style={{ marginTop: 12 }} />
        ) : null}
      </Card>

      <Card title="计算结果">
        {okResult ? (
          <>
            <div className={styles.resultRow}>
              <span className={styles.resultName}>校验和</span>
              <span className={styles.resultHex}>0x{checksumHex}</span>
              <span className={styles.resultDec}>{okResult.checksum}</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(checksumHex ?? '')}>
                复制
              </Button>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultName}>回填后报文</span>
              <span className={styles.resultHexLong}>{filledHex}</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(filledHex ?? '')}>
                复制
              </Button>
            </div>
            <Alert
              type={okResult.valid ? 'success' : 'error'}
              showIcon
              style={{ marginTop: 12 }}
              message={okResult.valid ? '回填后重新校验通过（16 位反码求和为 0xFFFF）' : '校验未通过，请检查输入'}
            />
          </>
        ) : (
          <div className={styles.hint}>输入合法的十六进制报文后自动计算。</div>
        )}
        <div className={styles.hint}>
          互联网校验和由 RFC 1071 定义：按 16 位字反码求和、折叠进位后逐位取反。TCP（RFC 793）与 UDP（RFC 768）
          计算前需在段前拼接 12 字节伪首部（源 / 目的地址、协议号、段长度）。所有计算仅在浏览器本地完成。
        </div>
      </Card>
    </div>
  );
};

export default TcpipChecksum;
