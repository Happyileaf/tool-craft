'use client';

import { Alert, Button, Card, Input, InputNumber, Segmented, Select, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { A4_PRESETS, INTERVAL_PRESETS, PITCH_MODE, type PitchMode } from './constants';
import styles from './index.module.css';
import {
  calculateInterval,
  frequencyDistanceInCents,
  frequencyToNote,
  getOctaveFrequencyTable,
  noteToFrequency,
  parseNote,
} from './utils/pitch';

const { Text } = Typography;

/** 固定小数格式化 */
function formatHz(value: number, digits = 3): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * 音乐音高与频率互算器
 *
 * 基于十二平均律，支持自定义 A4 调音基准，提供：
 * 1. 音名 → 频率
 * 2. 频率 → 最近音名 + 音分偏差
 * 3. 两音音程（半音 / 音程名 / 频率比 / 音分）
 * 4. 整八度音名频率表
 */
export default function MusicPitchConverter() {
  const [mode, setMode] = useState<PitchMode>(PITCH_MODE.NOTE_TO_FREQ);
  const [a4, setA4] = useState<number>(440);

  // 音名 → 频率
  const [noteInput, setNoteInput] = useState<string>('A4');

  // 频率 → 音名
  const [frequencyInput, setFrequencyInput] = useState<number>(440);

  // 音程
  const [fromNote, setFromNote] = useState<string>('C4');
  const [toNote, setToNote] = useState<string>('G4');

  // 八度表
  const [octave, setOctave] = useState<number>(4);

  const noteFrequency = useMemo(() => {
    try {
      const parsed = parseNote(noteInput);
      return { parsed, frequency: noteToFrequency(noteInput, a4) };
    } catch {
      return null;
    }
  }, [noteInput, a4]);

  const pitchFromFrequency = useMemo(() => {
    try {
      return frequencyToNote(frequencyInput, a4);
    } catch {
      return null;
    }
  }, [frequencyInput, a4]);

  const interval = useMemo(() => {
    try {
      return calculateInterval(fromNote, toNote, a4);
    } catch {
      return null;
    }
  }, [fromNote, toNote, a4]);

  const tableData = useMemo(() => {
    try {
      return getOctaveFrequencyTable(octave, a4);
    } catch {
      return [];
    }
  }, [octave, a4]);

  const tableColumns = [
    { title: '音名', dataIndex: 'note', key: 'note', render: (value: string) => <Text strong>{value}</Text> },
    {
      title: '频率 (Hz)',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (value: number) => formatHz(value, 3),
    },
    {
      title: '与 A4 音分差',
      key: 'cents',
      render: (_: unknown, row: { frequency: number }) =>
        `${frequencyDistanceInCents(a4, row.frequency).toFixed(1)} cents`,
    },
  ];

  return (
    <div className={styles.container}>
      <Segmented
        block
        value={mode}
        onChange={(value) => setMode((value as PitchMode) ?? PITCH_MODE.NOTE_TO_FREQ)}
        options={[
          { label: '音名 → 频率', value: PITCH_MODE.NOTE_TO_FREQ },
          { label: '频率 → 音名', value: PITCH_MODE.FREQ_TO_NOTE },
          { label: '音程 / 频率比', value: PITCH_MODE.INTERVAL },
          { label: '八度频率表', value: PITCH_MODE.TABLE },
        ]}
      />

      <div className={styles.a4Panel}>
        <Space wrap align="baseline">
          <Text strong>调音基准 A4</Text>
          <InputNumber
            min={1}
            max={10000}
            step={1}
            precision={2}
            value={a4}
            onChange={(value) => setA4(value ?? 440)}
            addonAfter="Hz"
          />
          {A4_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              size="small"
              type={a4 === preset.value ? 'primary' : 'default'}
              onClick={() => setA4(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </Space>
      </div>

      {mode === PITCH_MODE.NOTE_TO_FREQ && (
        <>
          <Card size="small" title="输入音名（科学音高记法 SPN）">
            <Space wrap>
              <Input
                style={{ width: 200 }}
                placeholder="如 A4、C#5、Bb3"
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
              />
              <Text type="secondary">字母 A–G + 可选 #/b + 八度（-1 至 9）</Text>
            </Space>
          </Card>
          {noteFrequency ? (
            <div className={styles.resultCard}>
              <Space>
                <Text style={{ fontSize: 22 }}>{noteFrequency.parsed.full}</Text>
                <Tag>等價 MIDI {noteFrequency.parsed.midi}</Tag>
              </Space>
              <div className={styles.heroGrid} style={{ marginTop: 14 }}>
                <div className={styles.heroItem}>
                  <span className={styles.heroLabel}>频率</span>
                  <span className={styles.heroValue}>
                    {formatHz(noteFrequency.frequency)}
                    <span className={styles.heroUnit}> Hz</span>
                  </span>
                </div>
              </div>
              <div className={styles.formula}>
                f = f_A4 × 2^((n − 69) / 12) = {a4} × 2^(({noteFrequency.parsed.midi} − 69) / 12)
              </div>
            </div>
          ) : (
            <Alert type="error" showIcon message="音名格式无效，示例：C4、A#4、Bb3" />
          )}
        </>
      )}

      {mode === PITCH_MODE.FREQ_TO_NOTE && (
        <>
          <Card size="small" title="输入频率">
            <InputNumber
              min={0.001}
              max={20000}
              step={1}
              precision={4}
              style={{ width: 240 }}
              value={frequencyInput}
              onChange={(value) => setFrequencyInput(value ?? 440)}
              addonAfter="Hz"
            />
          </Card>
          {pitchFromFrequency ? (
            <div className={styles.resultCard}>
              <Space>
                <Text style={{ fontSize: 22 }}>{pitchFromFrequency.nearest.full}</Text>
                <Tag>等價 MIDI {pitchFromFrequency.nearest.midi}</Tag>
              </Space>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>音分偏差</span>
                  <span className={styles.metaValue}>
                    {pitchFromFrequency.cents >= 0 ? '+' : ''}
                    {pitchFromFrequency.cents.toFixed(2)} cents
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>连续音高编号</span>
                  <span className={styles.metaValue}>{pitchFromFrequency.continuousMidi.toFixed(3)}</span>
                </div>
              </div>
              <div className={styles.formula}>
                n = 69 + 12 · log₂(f / f_A4) = 69 + 12 · log₂({frequencyInput} / {a4})
              </div>
            </div>
          ) : (
            <Alert type="error" showIcon message="频率必须为正数，且对应音高须在 MIDI 0–127 范围内" />
          )}
        </>
      )}

      {mode === PITCH_MODE.INTERVAL && (
        <>
          <Card size="small" title="选择两个音符">
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <span className={styles.label}>起始音</span>
                <Input style={{ width: 180 }} value={fromNote} onChange={(event) => setFromNote(event.target.value)} />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>目标音</span>
                <Input style={{ width: 180 }} value={toNote} onChange={(event) => setToNote(event.target.value)} />
              </div>
            </div>
            <div className={styles.presetRow} style={{ marginTop: 12 }}>
              {INTERVAL_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="small"
                  onClick={() => {
                    setFromNote(preset.from);
                    setToNote(preset.to);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </Card>
          {interval ? (
            <div className={styles.resultCard}>
              <Space>
                <Text style={{ fontSize: 20 }}>{interval.intervalName}</Text>
                <Tag>{interval.semitones >= 0 ? `上行 ${interval.semitones}` : `下行 ${Math.abs(interval.semitones)}`} 半音</Tag>
              </Space>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>半音数</span>
                  <span className={styles.metaValue}>{interval.semitones}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>频率比 f₂/f₁</span>
                  <span className={styles.metaValue}>{interval.frequencyRatio.toFixed(6)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>音分距离</span>
                  <span className={styles.metaValue}>{interval.cents.toFixed(2)} cents</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>English</span>
                  <span className={styles.metaValue}>{interval.intervalNameEn}</span>
                </div>
              </div>
              <div className={styles.formula}>
                ratio = 2^(n/12) = 2^({interval.semitones}/12)；cents = 1200 · log₂(ratio)
              </div>
            </div>
          ) : (
            <Alert type="error" showIcon message="音名格式无效，请检查两个输入（示例：C4、F#4）" />
          )}
        </>
      )}

      {mode === PITCH_MODE.TABLE && (
        <>
          <Card size="small" title="选择八度">
            <Select
              style={{ width: 160 }}
              value={octave}
              onChange={(value) => setOctave(value)}
              options={Array.from({ length: 11 }, (_, index) => {
                const value = index - 1;
                return { label: `八度 ${value}`, value };
              })}
            />
          </Card>
          <Table
            size="small"
            rowKey="note"
            pagination={false}
            dataSource={tableData}
            columns={tableColumns}
          />
        </>
      )}

      <Alert
        type="info"
        showIcon
        message="全部计算基于十二平均律并在浏览器本地完成；实际乐器还存在纯律 / 五度相生律、拍音与在制音高偏差，调音时请结合人耳与参考音。"
      />
    </div>
  );
}
