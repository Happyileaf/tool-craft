'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import {
  DEFAULT_A4_FREQUENCY,
  DEFAULT_FREQUENCY,
  DEFAULT_MIDI_NOTE,
  DEFAULT_NOTE_NAME,
  InputModeEnum,
  MODE_OPTIONS,
  OCTAVE_SELECT_OPTIONS,
} from './constants';
import {
  MAX_MIDI,
  MIN_MIDI,
  frequencyToMidi,
  getOctaveNotes,
  midiToFrequency,
  midiToNoteName,
  noteNameToMidi,
  type OctaveNote,
} from './utils/midi';
import styles from './index.module.css';

interface ConversionOutput {
  midi: number;
  name: string;
  frequency: number;
  cents?: number;
}

const octaveColumns: ColumnsType<OctaveNote> = [
  { title: '音名', dataIndex: 'full', key: 'full', render: (full: string) => <Tag>{full}</Tag> },
  { title: 'MIDI 编号', dataIndex: 'midi', key: 'midi' },
  {
    title: '频率 (Hz)',
    dataIndex: 'frequency',
    key: 'frequency',
    render: (frequency: number) => frequency.toFixed(2),
  },
];

/**
 * MIDI 音符与频率互转计算器：输入 MIDI 编号 / 音名 / 频率任一项，
 * 按十二平均律实时换算其余两项，支持自定义 A4 基准频率，
 * 并可展开指定八度的 12 音频率表；全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为 MIDI 编号）
 * @returns MIDI 音符换算交互界面
 */
const MidiNoteConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<InputModeEnum>(InputModeEnum.MIDI);
  const [rawInput, setRawInput] = React.useState<string>(defaultInput || String(DEFAULT_MIDI_NOTE));
  const [a4Frequency, setA4Frequency] = React.useState<number>(DEFAULT_A4_FREQUENCY);
  const [octave, setOctave] = React.useState<number>(4);

  const output = React.useMemo<{ value: ConversionOutput | null; error: string | null }>(() => {
    try {
      if (rawInput.trim() === '') {
        return { value: null, error: null };
      }
      if (mode === InputModeEnum.MIDI) {
        const note = Number(rawInput);
        if (!Number.isInteger(note) || note < MIN_MIDI || note > MAX_MIDI) {
          return { value: null, error: 'MIDI 编号必须是 0–127 之间的整数。' };
        }
        return {
          value: {
            midi: note,
            name: midiToNoteName(note).full,
            frequency: midiToFrequency(note, a4Frequency),
          },
          error: null,
        };
      }
      if (mode === InputModeEnum.NAME) {
        const note = noteNameToMidi(rawInput);
        return {
          value: {
            midi: note,
            name: midiToNoteName(note).full,
            frequency: midiToFrequency(note, a4Frequency),
          },
          error: null,
        };
      }
      const frequency = Number(rawInput);
      if (!Number.isFinite(frequency) || frequency <= 0) {
        return { value: null, error: '频率必须为正数（Hz）。' };
      }
      if (!Number.isFinite(a4Frequency) || a4Frequency <= 0) {
        return { value: null, error: 'A4 基准频率必须为正数。' };
      }
      const conversion = frequencyToMidi(frequency, a4Frequency);
      const nearest = conversion.nearestNote;
      if (nearest < MIN_MIDI || nearest > MAX_MIDI) {
        return { value: null, error: '对应音符超出 MIDI 0–127 范围。' };
      }
      return {
        value: {
          midi: nearest,
          name: midiToNoteName(nearest).full,
          frequency,
          cents: conversion.cents,
        },
        error: null,
      };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : '输入无效。' };
    }
  }, [mode, rawInput, a4Frequency]);

  const octaveNotes = React.useMemo<OctaveNote[]>(() => {
    try {
      if (!Number.isFinite(a4Frequency) || a4Frequency <= 0) {
        return [];
      }
      return getOctaveNotes(octave, a4Frequency);
    } catch {
      return [];
    }
  }, [octave, a4Frequency]);

  /**
   * 切换输入方式并载入对应示例值
   *
   * @param next - 目标输入方式
   */
  const handleModeChange = (next: InputModeEnum) => {
    setMode(next);
    setRawInput(
      next === InputModeEnum.MIDI
        ? String(DEFAULT_MIDI_NOTE)
        : next === InputModeEnum.NAME
          ? DEFAULT_NOTE_NAME
          : String(DEFAULT_FREQUENCY),
    );
  };

  const placeholder =
    mode === InputModeEnum.MIDI
      ? '输入 0–127 的 MIDI 编号，如 69'
      : mode === InputModeEnum.NAME
        ? '输入音名，如 C4、A#4、Bb3'
        : '输入频率（Hz），如 440';

  return (
    <div className={styles.container}>
      <Card title="MIDI 音符与频率互转（十二平均律）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as InputModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={MODE_OPTIONS}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setRawInput(
              mode === InputModeEnum.MIDI
                ? String(DEFAULT_MIDI_NOTE)
                : mode === InputModeEnum.NAME
                  ? DEFAULT_NOTE_NAME
                  : String(DEFAULT_FREQUENCY),
            )}
          >
            载入示例
          </Button>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>输入值：</span>
          <Input
            className={styles.valueInput}
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder={placeholder}
            spellCheck={false}
          />
          <span className={styles.label}>A4 基准频率 (Hz)：</span>
          <InputNumber
            className={styles.a4Input}
            min={1}
            step={1}
            precision={0}
            value={a4Frequency}
            onChange={(value) => setA4Frequency(value ?? 0)}
          />
        </div>

        {output.error && (
          <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入无效" description={output.error} />
        )}
      </Card>

      {output.value && (
        <div className={styles.resultGrid}>
          <Card>
            <Statistic title="MIDI 编号" value={output.value.midi} />
          </Card>
          <Card>
            <Statistic title="音名" value={output.value.name} />
          </Card>
          <Card>
            <Statistic title="频率 (Hz)" value={output.value.frequency} precision={2} />
          </Card>
          {typeof output.value.cents === 'number' && (
            <Card>
              <Statistic
                title="与最近音符偏差（音分）"
                value={output.value.cents}
                precision={2}
                suffix=" cents"
              />
            </Card>
          )}
        </div>
      )}

      <Card title="八度音符频率表">
        <Space>
          <span className={styles.label}>选择八度：</span>
          <Select
            className={styles.octaveSelect}
            value={octave}
            onChange={(value: number) => setOctave(value)}
            options={OCTAVE_SELECT_OPTIONS}
          />
        </Space>
        <Table<OctaveNote>
          style={{ marginTop: 16 }}
          rowKey="midi"
          columns={octaveColumns}
          dataSource={octaveNotes}
          size="small"
          pagination={false}
        />
        <Collapse
          style={{ marginTop: 16 }}
          items={[
            {
              key: 'formula',
              label: '换算公式与说明',
              children: (
                <div className={styles.hint}>
                  十二平均律中，每升高一个半音频率乘以 2^(1/12)，故 f = A4 × 2^((MIDI − 69) /
                  12)。MIDI 69 对应 A4（440 Hz 国际标准），MIDI 60 为中央 C（C4，约 261.63
                  Hz）。音分偏差 = (浮点 MIDI − 最近音符) × 100，每 100 音分为一个半音。
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default MidiNoteConverter;
