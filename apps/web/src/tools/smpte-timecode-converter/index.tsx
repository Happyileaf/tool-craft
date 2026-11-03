'use client';

import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Input, Radio, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  SMPTE_DIRECTION_OPTIONS,
  SMPTE_SAMPLE_FRAMES,
  SMPTE_SAMPLE_TIMECODE,
} from './constants';
import styles from './index.module.css';
import {
  FPS_PROFILES,
  SMPTE_PROFILE_KEYS,
  formatRealDuration,
  formatTimecode,
  parseTimecode,
  realMsToTotalFrames,
  timecodeToTotalFrames,
  totalFramesToRealMs,
  totalFramesToTimecode,
  validateTimecode,
} from './utils/smpte';

const { Text } = Typography;

type Direction = 'tc-to-frames' | 'frames-to-tc';

interface ResultRow {
  key: string;
  label: string;
  value: string;
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动选择文本复制');
  }
};

const resultColumns: ColumnsType<ResultRow> = [
  { title: '字段', dataIndex: 'label', key: 'label', width: 220 },
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
];

const SmpteTimecodeConverter: React.FC<ToolComponentProps> = () => {
  const [direction, setDirection] = useState<Direction>('tc-to-frames');
  const [profileKey, setProfileKey] = useState<string>('29.97df');
  const [tcInput, setTcInput] = useState(SMPTE_SAMPLE_TIMECODE);
  const [frameInput, setFrameInput] = useState(SMPTE_SAMPLE_FRAMES);
  const profile = FPS_PROFILES[profileKey] ?? FPS_PROFILES['29.97df']!;

  const tcResult = useMemo(() => {
    const parsed = parseTimecode(tcInput);
    if (!parsed) {
      return { error: '无法解析：请输入 HH:MM:SS:FF（或丢帧写法 HH:MM:SS;FF）' as const };
    }
    const invalid = validateTimecode(parsed.parts, profile);
    if (invalid) {
      return { error: invalid };
    }
    const total = timecodeToTotalFrames(parsed.parts, profile);
    const realMs = totalFramesToRealMs(total, profile);
    return {
      total,
      realMs,
      rows: [
        { key: 'tc', label: '规范时间码写法', value: formatTimecode(parsed.parts, profile.dropFrame) },
        { key: 'total', label: '从 00:00:00 起的总帧数', value: String(total) },
        { key: 'real', label: '真实时长（墙钟）', value: formatRealDuration(realMs) },
        { key: 'realsec', label: '真实秒数', value: (realMs / 1000).toFixed(6) },
      ] as ResultRow[],
    };
  }, [tcInput, profile]);

  const framesResult = useMemo(() => {
    const trimmed = frameInput.trim();
    if (!trimmed) {
      return { error: '请输入总帧数（非负整数）或真实时长（如 3661.5s / 61m / 1h）' as const };
    }
    let total: number | null = null;
    let sourceLabel = '总帧数';
    if (/^\d+$/.test(trimmed)) {
      total = Number(trimmed);
    } else {
      const durationMatch = trimmed.match(/^([\d.]+)\s*(ms|s|m|h)$/i);
      if (durationMatch) {
        const amount = Number(durationMatch[1] ?? '');
        const unit = (durationMatch[2] ?? '').toLowerCase();
        const ms = unit === 'ms' ? amount : amount * (unit === 's' ? 1000 : unit === 'm' ? 60_000 : 3_600_000);
        total = realMsToTotalFrames(ms, profile);
        sourceLabel = `真实时长（${trimmed} ≈ ${total} 帧）`;
      }
    }
    if (total === null || !Number.isSafeInteger(total) || total < 0) {
      return { error: '无法解析：总帧数需为 0 到 2^53 之间的整数，或形如 90s / 12.5m / 1h 的时长' as const };
    }
    const parts = totalFramesToTimecode(total, profile);
    const realMs = totalFramesToRealMs(total, profile);
    return {
      total,
      sourceLabel,
      rows: [
        { key: 'src', label: '输入解释', value: sourceLabel },
        { key: 'tc', label: '时间码', value: formatTimecode(parts, profile.dropFrame) },
        { key: 'real', label: '真实时长（墙钟）', value: formatRealDuration(realMs) },
        { key: 'realms', label: '真实毫秒数', value: realMs.toFixed(3) },
      ] as ResultRow[],
    };
  }, [frameInput, profile]);

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>帧率制式</Text>
            <div style={{ marginTop: 8 }}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                size="small"
                value={profileKey}
                onChange={(event) => setProfileKey(event.target.value)}
                options={SMPTE_PROFILE_KEYS.map((key) => ({
                  label: FPS_PROFILES[key]?.label ?? key,
                  value: key,
                }))}
              />
            </div>
          </div>

          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            onChange={(event) => setDirection(event.target.value as Direction)}
            options={SMPTE_DIRECTION_OPTIONS}
          />

          {profile.dropFrame && (
            <Alert
              type="info"
              showIcon
              message="丢帧（DF）模式：非整 10 分钟的每分钟跳过帧号 0、1，时间码用分号 HH:MM:SS;FF 表示。29.97 fps 每帧真实时长为 1.001/30 秒。"
            />
          )}

          {direction === 'tc-to-frames' ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>SMPTE 时间码</Text>
                <Input
                  className={styles.editor}
                  size="large"
                  style={{ marginTop: 8, fontSize: 18, letterSpacing: '0.1em' }}
                  value={tcInput}
                  onChange={(event) => setTcInput(event.target.value)}
                  placeholder="HH:MM:SS:FF 或 HH:MM:SS;FF"
                />
              </div>
              <Space wrap>
                <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setTcInput('00:01:00;02')}>
                  DF 示例 00:01:00;02
                </Button>
                <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setTcInput('01:00:00:00')}>
                  1 小时整
                </Button>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(tcResult.rows?.[0]?.value ?? tcInput)}>
                  复制规范写法
                </Button>
              </Space>
              {'error' in tcResult && tcResult.error ? (
                <Alert type="error" showIcon message={tcResult.error} />
              ) : (
                <Table<ResultRow> columns={resultColumns} dataSource={tcResult.rows} pagination={false} size="small" bordered />
              )}
            </Space>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>总帧数 / 真实时长</Text>
                <Input
                  className={styles.editor}
                  size="large"
                  style={{ marginTop: 8 }}
                  value={frameInput}
                  onChange={(event) => setFrameInput(event.target.value)}
                  placeholder="如 1800 或 90s 或 12.5m 或 1h"
                />
              </div>
              <Space wrap>
                <Tag color="blue">当前制式：{profile.label}</Tag>
                <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setFrameInput('17982')}>
                  示例：17982 帧（DF 整 10 分钟）
                </Button>
              </Space>
              {'error' in framesResult && framesResult.error ? (
                <Alert type="error" showIcon message={framesResult.error} />
              ) : (
                <Table<ResultRow> columns={resultColumns} dataSource={framesResult.rows} pagination={false} size="small" bordered />
              )}
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default SmpteTimecodeConverter;
