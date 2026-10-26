'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Descriptions, Input, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  analyzeMac,
  formatMac,
  mac48ToEui64,
  parseMac,
  type MacAnalysis,
  type MacFormat,
  type ParsedMac,
} from './utils/mac';
import { DEFAULT_INPUT, FORMAT_LABELS, FORMAT_OPTIONS, FORMAT_PLACEHOLDER } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface ConvertRow {
  key: MacFormat;
  format: string;
  value: string;
}

interface ConvertResult {
  parsed: ParsedMac;
  analysis: MacAnalysis;
  rows: ConvertRow[];
  eui64: string | null;
}

/**
 * MAC 地址格式转换与校验工具：解析冒号 / 连字符 / Cisco 点分 / 裸十六进制四种写法的
 * MAC-48 与 EUI-64 地址，一次性输出四种规范格式，并解读首位字节的 I/G、U/L 标志位、
 * OUI 与设备标识；对 MAC-48 额外给出 EUI-64 派生结果。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns MAC 地址转换与校验交互界面
 */
const MacAddressConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [uppercase, setUppercase] = React.useState<boolean>(true);

  const result = React.useMemo<ConvertResult | { error: string } | null>(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed = parseMac(trimmed);
      const analysis = analyzeMac(parsed.bytes, parsed.bitCount);
      const rows: ConvertRow[] = FORMAT_OPTIONS.map((option) => ({
        key: option.value,
        format: FORMAT_LABELS[option.value],
        value: formatMac(parsed.bytes, option.value, uppercase),
      }));
      const eui64 =
        parsed.bitCount === 48
          ? formatMac(mac48ToEui64(parsed.bytes), 'colon', uppercase)
          : null;
      return { parsed, analysis, rows, eui64 };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '无法解析该 MAC 地址' };
    }
  }, [input, uppercase]);

  /**
   * 复制某一格式的输出
   *
   * @param value - 待复制文本
   */
  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  const columns = [
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 300,
    },
    {
      title: '输出',
      dataIndex: 'value',
      key: 'value',
      render: (value: string) => <span className={styles.monoValue}>{value}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: unknown, record: ConvertRow) => (
        <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.value)}>
          复制
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="MAC 地址格式转换与校验">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={FORMAT_PLACEHOLDER}
            spellCheck={false}
            className={styles.monoInput}
            size="large"
          />
          <Checkbox
            checked={uppercase}
            onChange={(event) => setUppercase(event.target.checked)}
          >
            大写输出十六进制字母（A-F）
          </Checkbox>

          {result === null && (
            <Alert type="info" showIcon message="输入 MAC 地址后将显示校验结论与各格式输出" />
          )}

          {result !== null && 'error' in result && (
            <Alert type="error" showIcon message="无法解析" description={result.error} />
          )}

          {result !== null && !('error' in result) && (
            <>
              <Alert
                type="success"
                showIcon
                message={
                  <Space size="large" wrap>
                    <span>
                      合法的 <strong>{result.parsed.bitCount === 48 ? 'MAC-48（48 位）' : 'EUI-64（64 位）'}</strong> 地址
                    </span>
                    <span>识别输入格式：{FORMAT_LABELS[result.parsed.format]}</span>
                  </Space>
                }
              />

              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="传输类型（I/G 位，首字节 bit0）">
                  {result.analysis.isMulticast ? (
                    <Tag color="orange">{result.analysis.transmissionType}</Tag>
                  ) : (
                    <Tag color="green">{result.analysis.transmissionType}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="管理方式（U/L 位，首字节 bit1）">
                  {result.analysis.isLocallyAdministered ? (
                    <Tag color="orange">{result.analysis.administrationType}</Tag>
                  ) : (
                    <Tag color="blue">{result.analysis.administrationType}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="首字节二进制">
                  <span className={styles.monoValue}>{result.analysis.firstOctetBinary}</span>
                </Descriptions.Item>
                <Descriptions.Item label="地址位数">
                  {result.analysis.bitCount} 位（{result.analysis.bitCount === 48 ? 6 : 8} 字节）
                </Descriptions.Item>
                <Descriptions.Item label="OUI 厂商代码（前 3 字节）">
                  <span className={styles.monoValue}>{result.analysis.oui}</span>
                </Descriptions.Item>
                <Descriptions.Item label="设备标识（其余字节）">
                  <span className={styles.monoValue}>{result.analysis.deviceIdentifier}</span>
                </Descriptions.Item>
                {result.eui64 !== null && (
                  <Descriptions.Item label="EUI-64 派生（插入 FF:FE）" span={2}>
                    <Space>
                      <span className={styles.monoValue}>{result.eui64}</span>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(result.eui64 ?? '')}
                      >
                        复制
                      </Button>
                    </Space>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Table
                columns={columns}
                dataSource={result.rows}
                pagination={false}
                size="small"
                bordered
              />

              <div className={styles.hint}>
                首字节最低位（bit0）为 I/G 位：0 表示单播（网卡个体地址），1 表示组播 / 广播；
                次低位（bit1）为 U/L 位：0 表示厂商分配的全球唯一地址（UAA），1 表示软件设置的本地管理地址（LAA）。
                MAC-48 派生 EUI-64 时在 OUI 与设备标识之间插入 FF:FE，本工具不翻转 U/L 位。
                所有解析与转换均在浏览器本地完成，不上传任何内容。
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default MacAddressConverter;
