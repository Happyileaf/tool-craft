import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CopyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import ToolMetaHeader from '../../components/ToolMetaHeader';
import ToolDocSection from '../../components/ToolDocSection';
import { NTP_DATE_PLACEHOLDER, NTP_DIRECTION_OPTIONS, NTP_SAMPLE_INPUT } from './constants';
import styles from './index.module.css';
import {
  NTP_EPOCH_OFFSET_SECONDS,
  NTP_FRACTION_SCALE,
  NTP_ROLLOVER_UNIX_MS,
  formatBeijing,
  formatUtcIso,
  ntpToUnixMs,
  parseNtpInput,
  splitNtp,
  unixMsToNtp,
} from './utils/ntp';

const { Paragraph, Text } = Typography;

interface NtpRow {
  key: string;
  label: string;
  value: string;
  copyable?: boolean;
}

type Direction = 'ntp-to-date' | 'date-to-ntp';

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动选择文本复制');
  }
};

/**
 * 解析日期输入：ISO 字符串、Unix 秒（10 位）或 Unix 毫秒（13 位）
 */
function parseDateInput(text: string): number | null {
  const input = text.trim();
  if (!input) {
    return null;
  }
  if (/^\d+$/.test(input)) {
    const n = Number(input);
    if (input.length <= 11) {
      return n * 1000;
    }
    return n;
  }
  const ms = Date.parse(input);
  return Number.isNaN(ms) ? null : ms;
}

function NtpToDatePanel() {
  const [input, setInput] = useState(NTP_SAMPLE_INPUT);
  const [era, setEra] = useState(0);

  const result = useMemo(() => {
    const value = parseNtpInput(input);
    if (value === null) {
      return { error: '无法解析：请输入十进制 uint64、0x 十六进制或点分十进制（秒.小数）' as const };
    }
    const unixMs = ntpToUnixMs(value, era);
    if (!Number.isFinite(unixMs)) {
      return { error: '换算结果超出可表示的日期范围' as const };
    }
    const { seconds, fraction } = splitNtp(value);
    const unixSeconds = unixMs / 1000;
    const fracDecimal =
      fraction === 0
        ? '0'
        : String((BigInt(fraction) * 1000000000n) / BigInt(NTP_FRACTION_SCALE)).replace(/0+$/, '');
    return {
      value,
      seconds,
      fraction,
      unixMs,
      unixSeconds,
      hex: `0x${value.toString(16).padStart(16, '0')}`,
      dot: `${seconds + era * NTP_FRACTION_SCALE}.${fracDecimal}`,
      iso: formatUtcIso(unixMs),
      beijing: formatBeijing(unixMs),
      warning:
        unixMs >= NTP_ROLLOVER_UNIX_MS && era === 0
          ? ('该原始值按 Era 0 解释落在 2036 回卷之后；若数据实际来自当前纪元（Era 1），请切换到 Era 1 重新解释。' as const)
          : null,
    };
  }, [input, era]);

  const columns: ColumnsType<NtpRow> = [
    { title: '字段', dataIndex: 'label', key: 'label', width: 180 },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (value: string, row) => (
        <Space>
          <Text copyable={row.copyable === false ? false : { text: value, tooltips: false }} style={{ wordBreak: 'break-all' }}>
            {value}
          </Text>
        </Space>
      ),
    },
  ];

  const rows: NtpRow[] =
    'error' in result
      ? []
      : [
          { key: 'raw-dec', label: '原始 64 位（十进制）', value: result.value.toString() },
          { key: 'raw-hex', label: '原始 64 位（十六进制）', value: result.hex },
          { key: 'dot', label: '点分十进制', value: result.dot },
          { key: 'sec', label: '秒字段（高 32 位）', value: String(result.seconds) },
          { key: 'frac', label: '小数部分（低 32 位）', value: String(result.fraction) },
          { key: 'unix', label: 'Unix 时间戳（秒）', value: result.unixSeconds.toString() },
          { key: 'unixms', label: 'Unix 时间戳（毫秒）', value: result.unixMs.toString() },
          { key: 'utc', label: 'UTC 时间', value: result.iso },
          { key: 'bj', label: '北京时间（UTC+8）', value: result.beijing },
        ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Paragraph className={styles.label}>NTP 时间戳</Paragraph>
        <Input.TextArea
          className={styles.editor}
          autoSize={{ minRows: 1, maxRows: 4 }}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="3913056000.0 或 16806042065367683072 或 0xe93c7f0000000000"
        />
      </div>
      <Space wrap>
        <Button icon={<ThunderboltOutlined />} onClick={() => setInput(NTP_SAMPLE_INPUT)}>
          填入示例
        </Button>
        <Radio.Group value={era} onChange={(event) => setEra(Number(event.target.value))} optionType="button" buttonStyle="solid" size="small">
          <Radio.Button value={0}>Era 0（1900–2036）</Radio.Button>
          <Radio.Button value={1}>Era 1（2036–2152）</Radio.Button>
        </Radio.Group>
      </Space>
      {'error' in result && result.error ? (
        <Alert type="error" showIcon message={result.error} />
      ) : (
        <>
          {result.warning && <Alert type="warning" showIcon message={result.warning} />}
          <Table<NtpRow>
            columns={columns}
            dataSource={rows}
            pagination={false}
            size="small"
            bordered
          />
        </>
      )}
    </Space>
  );
}

function DateToNtpPanel() {
  const [input, setInput] = useState('2024-01-01T00:00:00Z');

  const result = useMemo(() => {
    const unixMs = parseDateInput(input);
    if (unixMs === null) {
      return { error: '无法解析：请输入 ISO 8601 日期或 Unix 秒/毫秒数字' as const };
    }
    if (unixMs < -NTP_EPOCH_OFFSET_SECONDS * 1000) {
      return { error: '日期早于 NTP 纪元 1900-01-01 UTC，无法表示' as const };
    }
    const { value, era } = unixMsToNtp(unixMs);
    const { seconds, fraction } = splitNtp(value);
    const fracDecimal = fraction === 0 ? '0' : String((BigInt(fraction) * 1000000000n) / BigInt(NTP_FRACTION_SCALE)).replace(/0+$/, '');
    return {
      value,
      era,
      seconds,
      fraction,
      unixMs,
      hex: `0x${value.toString(16).padStart(16, '0')}`,
      dot: `${seconds + era * NTP_FRACTION_SCALE}.${fracDecimal}`,
      dotInEra: `${seconds}.${fracDecimal}`,
      iso: formatUtcIso(unixMs),
    };
  }, [input]);

  const rows: NtpRow[] =
    'error' in result
      ? []
      : [
          { key: 'utc', label: 'UTC 时间', value: result.iso, copyable: false },
          { key: 'unixms', label: 'Unix 毫秒', value: String(result.unixMs) },
          { key: 'era', label: 'NTP 纪元', value: `Era ${result.era}${result.era === 0 ? '（1900–2036）' : '（2036–2152）'}` },
          { key: 'dot', label: 'NTP 点分十进制（完整秒数）', value: result.dot },
          { key: 'dot-era', label: `NTP 点分十进制（Era ${result.era} 内）`, value: result.dotInEra },
          { key: 'raw-dec', label: '原始 64 位（十进制）', value: result.value.toString() },
          { key: 'raw-hex', label: '原始 64 位（十六进制）', value: result.hex },
          { key: 'sec', label: '秒字段（高 32 位）', value: String(result.seconds) },
          { key: 'frac', label: '小数部分（低 32 位）', value: String(result.fraction) },
        ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Paragraph className={styles.label}>日期 / Unix 时间戳</Paragraph>
        <Input.TextArea
          className={styles.editor}
          autoSize={{ minRows: 1, maxRows: 4 }}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={NTP_DATE_PLACEHOLDER}
        />
      </div>
      <Space wrap>
        <Button icon={<ThunderboltOutlined />} onClick={() => setInput(formatUtcIso(Date.now()).replace(/\.\d{3}Z$/, 'Z'))}>
          当前 UTC 时间
        </Button>
        <Button icon={<CopyOutlined />} onClick={() => copyText(input)}>
          复制输入
        </Button>
      </Space>
      {'error' in result && result.error ? (
        <Alert type="error" showIcon message={result.error} />
      ) : (
        <Table<NtpRow> columns={[
          { title: '字段', dataIndex: 'label', key: 'label', width: 240 },
          {
            title: '值',
            dataIndex: 'value',
            key: 'value',
            render: (value: string) => (
              <Text copyable={{ text: value, tooltips: false }} style={{ wordBreak: 'break-all' }}>
                {value}
              </Text>
            ),
          },
        ]} dataSource={rows} pagination={false} size="small" bordered />
      )}
    </Space>
  );
}

const NtpTimestampConverter: React.FC<{ defaultInput?: string }> = ({ defaultInput }) => {
  const [direction, setDirection] = useState<Direction>('ntp-to-date');

  return (
    <div className={styles.container}>
      <ToolMetaHeader slug="ntp-timestamp-converter" defaultInput={defaultInput} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            onChange={(event) => setDirection(event.target.value as Direction)}
            options={NTP_DIRECTION_OPTIONS}
          />
          <Alert
            type="info"
            showIcon
            message="NTP 时间戳为 64 位定点数：高 32 位为 1900-01-01 UTC 起的秒数，低 32 位为秒的小数部分。秒字段于 2036-02-07 回卷（Era 0 → 1）。"
          />
          {direction === 'ntp-to-date' ? <NtpToDatePanel /> : <DateToNtpPanel />}
        </Space>
      </Card>

      <Card>
        <ToolDocSection slug="ntp-timestamp-converter" />
      </Card>
    </div>
  );
};

export default NtpTimestampConverter;
