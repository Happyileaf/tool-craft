'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Space,
  message,
  type RadioChangeEvent,
} from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import {
  calculateIpv4Subnet,
  calculateIpv6Subnet,
  type Ipv4SubnetResult,
  type Ipv6SubnetResult,
} from './utils/subnet';
import {
  DEFAULT_ADDRESS,
  INPUT_MODE_OPTIONS,
  IPV4_FIELD_LABELS,
  IPV6_FIELD_LABELS,
  SUBNET_SAMPLES,
  type InputMode,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 地址族 */
type AddressFamily = 'ipv4' | 'ipv6';

/** 组件内的计算状态 */
interface ComputedState {
  /** 命中的地址族 */
  family: AddressFamily | null;
  /** IPv4 计算结果 */
  ipv4: Ipv4SubnetResult | null;
  /** IPv6 计算结果 */
  ipv6: Ipv6SubnetResult | null;
  /** 计算失败时的错误信息 */
  error: string | null;
}

/** 初始计算状态 */
const INITIAL_STATE: ComputedState = { family: null, ipv4: null, ipv6: null, error: null };

/**
 * 依据识别模式与输入内容判定地址族
 *
 * @param text - 已去除首尾空白的输入
 * @param mode - 识别模式
 * @returns 判定的地址族
 */
function detectFamily(text: string, mode: InputMode): AddressFamily {
  if (mode === 'ipv4') return 'ipv4';
  if (mode === 'ipv6') return 'ipv6';
  return text.includes(':') ? 'ipv6' : 'ipv4';
}

/**
 * 把结果字段格式化为展示文本
 *
 * @param key - 字段键名
 * @param value - 字段取值
 * @returns 展示文本
 */
function formatFieldValue(key: string, value: string | number | boolean): string {
  if (key === 'isPrivate') return value ? '是' : '否';
  if (key === 'ipClass') return `${String(value)} 类`;
  if (key === 'prefixLength') return `/${String(value)}`;
  return String(value);
}

/**
 * 把 32 位二进制字符串按 8 位分组，便于阅读
 *
 * @param bits - 32 位二进制字符串
 * @returns 以空格分隔的 8 位分组文本
 */
function groupBinary(bits: string): string {
  const chunks: string[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    chunks.push(bits.slice(index, index + 8));
  }
  return chunks.join(' ');
}

/**
 * CIDR / IP 子网计算器：由 IP 地址与 CIDR 前缀（或点分掩码）计算网络地址、
 * 广播地址、可用主机范围、主机数量与掩码信息，支持 IPv4 与 IPv6 前缀长度计算，
 * 全部计算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认地址
 * @returns 子网计算交互界面
 */
const CidrSubnetCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_ADDRESS);
  const [mode, setMode] = React.useState<InputMode>('auto');
  const [state, setState] = React.useState<ComputedState>(INITIAL_STATE);

  React.useEffect(() => {
    const text = input.trim();
    if (text === '') {
      setState({ family: null, ipv4: null, ipv6: null, error: '请输入 IP 地址或 CIDR 表示' });
      return;
    }
    try {
      const family = detectFamily(text, mode);
      if (family === 'ipv6') {
        setState({ family, ipv4: null, ipv6: calculateIpv6Subnet(text), error: null });
      } else {
        setState({ family, ipv4: calculateIpv4Subnet(text), ipv6: null, error: null });
      }
    } catch (caught) {
      setState({
        family: null,
        ipv4: null,
        ipv6: null,
        error: caught instanceof Error ? caught.message : '子网计算失败',
      });
    }
  }, [input, mode]);

  const ipv4 = state.ipv4;
  const ipv6 = state.ipv6;

  const fieldRows: { label: string; value: string }[] = [];
  if (ipv4) {
    IPV4_FIELD_LABELS.forEach((item) => {
      fieldRows.push({ label: item.label, value: formatFieldValue(item.key, ipv4[item.key]) });
    });
  } else if (ipv6) {
    IPV6_FIELD_LABELS.forEach((item) => {
      fieldRows.push({ label: item.label, value: formatFieldValue(item.key, ipv6[item.key]) });
    });
  }

  /**
   * 复制当前全部计算结果
   */
  const handleCopy = async () => {
    if (state.error || fieldRows.length === 0) {
      message.warning('请先修正输入后再复制');
      return;
    }
    const text = fieldRows.map((row) => `${row.label}：${row.value}`).join('\n');
    await copyToClipboard(text);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          {SUBNET_SAMPLES.map((sample) => (
            <Button key={sample.value} size="small" onClick={() => setInput(sample.value)}>
              {sample.label}
            </Button>
          ))}
        </Space>
        <Space wrap>
          <span>识别模式：</span>
          <Radio.Group
            value={mode}
            onChange={(event: RadioChangeEvent) => setMode(event.target.value as InputMode)}
            optionType="button"
            buttonStyle="solid"
            options={INPUT_MODE_OPTIONS}
          />
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制结果
          </Button>
        </Space>
      </div>

      <div className={styles.input}>
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入 IP 地址与 CIDR 前缀或子网掩码，例如 192.168.1.10/24 或 192.168.1.10 255.255.255.0"
          allowClear
        />
      </div>

      {state.error ? (
        <Alert type="error" showIcon message="输入非法" description={state.error} />
      ) : (
        <>
          <Card title={ipv4 ? 'IPv4 子网结果' : 'IPv6 子网结果'} className={styles.resultCard}>
            {fieldRows.map((row) => (
              <div key={row.label} className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{row.label}</span>
                <span className={styles.fieldValue}>{row.value}</span>
              </div>
            ))}
          </Card>

          {ipv4 ? (
            <Card title="二进制位视图">
              <div className={styles.binaryRow}>
                <span className={styles.fieldLabel}>地址</span>
                <span className={styles.binaryValue}>{groupBinary(ipv4.binaryAddress)}</span>
              </div>
              <div className={styles.binaryRow}>
                <span className={styles.fieldLabel}>掩码</span>
                <span className={styles.binaryValue}>{groupBinary(ipv4.binaryNetmask)}</span>
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
};

export default CidrSubnetCalculator;
