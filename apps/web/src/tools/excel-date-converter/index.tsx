'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  dateToSerial,
  formatDate,
  formatTime,
  serialToDate,
  type CivilDate,
  type DateSystem,
  type DayTime,
} from './utils/excelDate';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'fromSerial' | 'fromDate';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

interface SerialRow {
  key: DateSystem;
  label: string;
  value: string;
  note: string;
}

type SerialResult =
  | { error: string }
  | {
      date: CivilDate;
      time: DayTime;
      isPhantom: boolean;
      otherSystem: DateSystem;
      otherSerial: number;
      otherOk: boolean;
    };

type DateConvertResult =
  | { error: string }
  | { date: CivilDate; time: DayTime | undefined; s1900: number; s1904: number };

function parseDate(text: string): CivilDate {
  const m = DATE_RE.exec(text.trim());
  if (!m) {
    throw new Error('日期格式无法识别，请使用 YYYY-MM-DD，如 2023-01-01');
  }
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function parseTime(text: string): DayTime | undefined {
  const trimmed = text.trim();
  if (trimmed === '') {
    return undefined;
  }
  const m = TIME_RE.exec(trimmed);
  if (!m) {
    throw new Error('时间格式无法识别，请使用 HH:mm 或 HH:mm:ss（可加 .fff 毫秒）');
  }
  return {
    hour: Number(m[1]),
    minute: Number(m[2]),
    second: m[3] ? Number(m[3]) : 0,
    millisecond: m[4] ? Number(m[4].padEnd(3, '0')) : 0,
  };
}

function formatSerial(value: number): string {
  // 整数不带小数点；小数保留至多 8 位并去尾零
  return Number.isInteger(value) ? String(value) : String(value);
}

const ExcelDateConverter: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Mode>('fromSerial');
  const [serialText, setSerialText] = React.useState('44927');
  const [system, setSystem] = React.useState<DateSystem>('1900');
  const [dateText, setDateText] = React.useState('2023-01-01');
  const [timeText, setTimeText] = React.useState('00:00');

  const serialResult: SerialResult | null = React.useMemo(() => {
    if (mode !== 'fromSerial') return null;
    const trimmed = serialText.trim();
    if (trimmed === '') {
      return { error: '请输入序列号' };
    }
    const serial = Number(trimmed);
    if (!Number.isFinite(serial) || /[eExX]/.test(trimmed)) {
      return { error: '序列号必须是十进制数字（可带小数）' };
    }
    try {
      const r = serialToDate(serial, system);
      const otherSystem: DateSystem = system === '1900' ? '1904' : '1900';
      const otherSerial = system === '1900' ? serial - 1462 : serial + 1462;
      // 另一系统仅做等值展示；若对方系统不支持该序号（如 1900 系统无负值）则标注
      let otherOk = true;
      try {
        serialToDate(otherSerial, otherSystem);
      } catch {
        otherOk = false;
      }
      return {
        date: r.date,
        time: r.time,
        isPhantom: r.isPhantom,
        otherSystem,
        otherSerial,
        otherOk,
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [mode, serialText, system]);

  const dateResult: DateConvertResult | null = React.useMemo(() => {
    if (mode !== 'fromDate') return null;
    try {
      const date = parseDate(dateText);
      const time = parseTime(timeText);
      const s1900 = dateToSerial(date, time, '1900');
      const s1904 = dateToSerial(date, time, '1904');
      return { date, time, s1900, s1904 };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [mode, dateText, timeText]);

  const rows: SerialRow[] =
    mode === 'fromDate' && dateResult && 's1900' in dateResult
      ? [
          {
            key: '1900',
            label: '1900 日期系统（Windows 默认）',
            value: formatSerial(dateResult.s1900),
            note: '序列号 1 = 1900-01-01，含 phantom 序列号 60',
          },
          {
            key: '1904',
            label: '1904 日期系统（Mac）',
            value: formatSerial(dateResult.s1904),
            note: '序列号 0 = 1904-01-01，较 1900 系统恒小 1462',
          },
        ]
      : [];

  const columns = [
    { title: '日期系统', dataIndex: 'label', key: 'label', width: 240 },
    { title: '序列号', dataIndex: 'value', key: 'value' },
    { title: '说明', dataIndex: 'note', key: 'note' },
  ];

  const handleFillNow = () => {
    const now = new Date();
    const p = (v: number) => String(v).padStart(2, '0');
    setDateText(
      `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`,
    );
    setTimeText(`${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={[
            { value: 'fromSerial', label: '序列号 → 公历日期' },
            { value: 'fromDate', label: '公历日期 → 序列号' },
          ]}
          onChange={(e) => setMode(e.target.value as Mode)}
        />
        <Tag color="blue">1900 / 1904 双系统</Tag>
        <span className={styles.hint}>
          全程本地计算，日期按公历连续计数，结果不受浏览器时区影响
        </span>
      </div>

      {mode === 'fromSerial' ? (
        <Card className={styles.card} title="输入 Excel 日期序列号">
          <Space direction="vertical" size={12} className={styles.fullWidth}>
            <Radio.Group
              optionType="button"
              size="small"
              value={system}
              options={[
                { value: '1900', label: '1900 系统（Windows）' },
                { value: '1904', label: '1904 系统（Mac）' },
              ]}
              onChange={(e) => setSystem(e.target.value as DateSystem)}
            />
            <Space.Compact className={styles.fullWidth}>
              <Input
                value={serialText}
                onChange={(e) => setSerialText(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                placeholder="如 44927 或 44927.5"
              />
              <Button onClick={() => setSerialText('44927')}>填入样例</Button>
            </Space.Compact>
            <span className={styles.hint}>
              小数部分表示一天内的时刻：.0 = 00:00，.5 = 12:00，.25 = 06:00
            </span>
          </Space>
        </Card>
      ) : (
        <Card className={styles.card} title="输入公历日期时间">
          <Space direction="vertical" size={12} className={styles.fullWidth}>
            <div className={styles.inputRow}>
              <Input
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                placeholder="YYYY-MM-DD"
              />
              <Input
                value={timeText}
                onChange={(e) => setTimeText(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                placeholder="HH:mm:ss（可省略）"
              />
              <Button onClick={handleFillNow}>填入当前时刻</Button>
            </div>
            <span className={styles.hint}>
              日期按 YYYY-MM-DD 输入；时间可省略（视为 00:00）。结果同时给出两套系统的序列号
            </span>
          </Space>
        </Card>
      )}

      {mode === 'fromSerial' && serialResult && 'error' in serialResult ? (
        <Alert type="error" showIcon message={serialResult.error} />
      ) : null}
      {mode === 'fromDate' && dateResult && 'error' in dateResult ? (
        <Alert type="error" showIcon message={dateResult.error} />
      ) : null}

      {mode === 'fromSerial' && serialResult && 'date' in serialResult ? (
        <Card
          className={styles.card}
          title="转换结果"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                const text = `${formatDate(serialResult.date)} ${formatTime(serialResult.time)}`;
                copyToClipboard(text);
                message.success('已复制日期时间');
              }}
            >
              复制
            </Button>
          }
        >
          {serialResult.isPhantom ? (
            <Alert
              className={styles.alert}
              type="warning"
              showIcon
              message="序列号 60 是 Excel 的 phantom 日期 1900-02-29"
              description="1900 年并非闰年，现实中不存在这一天。Excel 为兼容 Lotus 1-2-3 保留了该错误序列号；它只出现在序列号→日期方向，无法由真实公历日期反推。"
            />
          ) : null}
          <div className={styles.resultGrid}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>公历日期</div>
              <code className={styles.bigMono}>{formatDate(serialResult.date)}</code>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>时刻（小数部分）</div>
              <code className={styles.bigMono}>{formatTime(serialResult.time)}</code>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>另一日期系统等价序列号</div>
              <code className={styles.bigMono}>
                {serialResult.otherOk ? formatSerial(serialResult.otherSerial) : '超出该系统范围'}
              </code>
              <span className={styles.hint}>
                {serialResult.otherSystem} 系统（两套系统恒相差 1462）
              </span>
            </div>
          </div>
        </Card>
      ) : null}

      {rows.length > 0 ? (
        <Card
          className={styles.card}
          title="两套日期系统的序列号"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                copyToClipboard(rows.map((r) => `${r.label}\t${r.value}`).join('\n'));
                message.success('已复制全部序列号');
              }}
            >
              复制全部
            </Button>
          }
        >
          <Table<SerialRow>
            columns={columns}
            dataSource={rows}
            rowKey="key"
            size="small"
            pagination={false}
          />
        </Card>
      ) : null}
    </div>
  );
};

export default ExcelDateConverter;
