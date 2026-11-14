'use client';

import { Alert, Card, Input, Segmented, Select, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  BIT_ORDER_OPTIONS,
  DEFAULT_BYTE_INPUT,
  DEFAULT_SAMPLE_TEXT,
  GLYPH_DEFINITIONS,
  MAX_GLYPHS,
  SEGMENT_NAMES,
  SEGMENT_ORDER_OPTIONS,
} from './constants';
import type { SegmentName } from './constants';
import {
  decodeByte,
  encodeText,
  formatHex,
  getBytePair,
  glyphMask,
  parseByteInput,
} from './utils/seven-segment';
import styles from './index.module.css';

const ON_COLOR = '#ef4444';
const OFF_COLOR = '#e5e7eb';

/** 以 SVG 绘制七段字形 */
function SegmentDisplay({ mask, size = 96 }: { mask: number; size?: number }) {
  const index = (segment: string): number => SEGMENT_NAMES.indexOf(segment as SegmentName);
  const isOn = (segment: string): boolean => (mask & (1 << index(segment))) !== 0;
  const segments = [
    { key: 'a', x1: 25, y1: 15, x2: 75, y2: 15 },
    { key: 'b', x1: 82, y1: 23, x2: 82, y2: 62 },
    { key: 'c', x1: 82, y1: 78, x2: 82, y2: 117 },
    { key: 'd', x1: 25, y1: 125, x2: 75, y2: 125 },
    { key: 'e', x1: 18, y1: 78, x2: 18, y2: 117 },
    { key: 'f', x1: 18, y1: 23, x2: 18, y2: 62 },
    { key: 'g', x1: 25, y1: 70, x2: 75, y2: 70 },
  ];

  return (
    <svg viewBox="0 0 100 140" width={size} height={size * 1.4} role="img" aria-label="七段数码管字形">
      {segments.map((segment) => (
        <line
          key={segment.key}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
          stroke={isOn(segment.key) ? ON_COLOR : OFF_COLOR}
          strokeWidth={9}
          strokeLinecap="round"
        />
      ))}
      <circle cx={90} cy={125} r={5} fill={isOn('dp') ? ON_COLOR : OFF_COLOR} />
    </svg>
  );
}

function toError(error: unknown): string {
  return error instanceof Error ? error.message : '计算失败';
}

export default function SevenSegmentCodecTool({ defaultInput }: ToolComponentProps) {
  const [text, setText] = useState(defaultInput ?? DEFAULT_SAMPLE_TEXT);
  const [activeHigh, setActiveHigh] = useState(true);
  const [msbFirst, setMsbFirst] = useState(false);
  const [orderKey, setOrderKey] = useState('a-to-dp');
  const [byteInput, setByteInput] = useState(DEFAULT_BYTE_INPUT);

  const options = useMemo(
    () => ({
      activeHigh,
      msbFirst,
      order: orderKey === 'a-to-dp' ? [...SEGMENT_NAMES] : [...SEGMENT_NAMES].reverse(),
    }),
    [activeHigh, msbFirst, orderKey],
  );

  const encoded = useMemo(() => encodeText(text, options), [text, options]);

  const parsedByte = useMemo(() => {
    try {
      return { value: parseByteInput(byteInput), error: null };
    } catch (error) {
      return { value: null, error: toError(error) };
    }
  }, [byteInput]);

  const decoded = useMemo(
    () => (parsedByte.value === null ? null : decodeByte(parsedByte.value, options)),
    [parsedByte, options],
  );

  const pairs = decoded === null ? null : getBytePair(decoded.mask);

  return (
    <div className={styles.container}>
      <Card title="字符 → 段码">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="输入字符，如 1234、A.8、HELLO；小数点会叠加到前一个字形"
            allowClear
            maxLength={MAX_GLYPHS * 2}
          />
          <Space wrap size={16}>
            <Space size={8}>
              <span className={styles.label}>极性</span>
              <Segmented
                options={[
                  { label: '共阴（高电平点亮）', value: 'cathode' },
                  { label: '共阳（低电平点亮）', value: 'anode' },
                ]}
                value={activeHigh ? 'cathode' : 'anode'}
                onChange={(value) => setActiveHigh(value === 'cathode')}
              />
            </Space>
            <Space size={8}>
              <span className={styles.label}>位序</span>
              <Segmented
                options={BIT_ORDER_OPTIONS}
                value={msbFirst ? 'msb' : 'lsb'}
                onChange={(value) => setMsbFirst(value === 'msb')}
              />
            </Space>
            <Space size={8}>
              <span className={styles.label}>段序</span>
              <Select
                options={SEGMENT_ORDER_OPTIONS}
                value={orderKey}
                onChange={setOrderKey}
                style={{ width: 220 }}
              />
            </Space>
          </Space>

          {encoded.skipped.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`已跳过未收录字符：${encoded.skipped.join('、')}`}
            />
          )}
          {encoded.glyphs.length === 0 && (
            <Alert type="info" showIcon message="没有可编码的字符，请输入数字、字母或 - _ =" />
          )}

          <div className={styles.grid}>
            {encoded.glyphs.map((glyph, glyphIndex) => {
              const pair = getBytePair(glyph.mask);
              return (
                <div className={styles.glyphCard} key={`${glyph.char}-${glyphIndex}`}>
                  <SegmentDisplay mask={glyph.mask} />
                  <div className={styles.char}>{glyph.char === ' ' ? '␠' : glyph.char}</div>
                  <Tag color="blue">{glyph.hex}</Tag>
                  <div className={styles.mono}>{glyph.binary}</div>
                  <div className={styles.meta}>
                    共阴 {formatHex(pair.cathode)} · 共阳 {formatHex(pair.anode)}
                  </div>
                  <div className={styles.meta}>
                    {glyph.segments.length > 0 ? glyph.segments.join(' + ') : '全灭'}
                  </div>
                </div>
              );
            })}
          </div>
        </Space>
      </Card>

      <Card title="段码 → 字符">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input
            value={byteInput}
            onChange={(event) => setByteInput(event.target.value)}
            placeholder="输入字节，如 0x3F、0b00111111、63、3F"
            allowClear
            className={styles.byteInput}
          />
          {parsedByte.error && <Alert type="error" showIcon message={parsedByte.error} />}

          {decoded && (
            <div className={styles.decodeRow}>
              <SegmentDisplay mask={decoded.mask} size={80} />
              <div className={styles.decodeInfo}>
                <div className={styles.chars}>
                  {decoded.chars.length > 0 ? (
                    decoded.chars.map((char) => (
                      <Tag color="blue" key={char} className={styles.charTag}>
                        {char}
                      </Tag>
                    ))
                   ) : (
                    <span className={styles.muted}>无完全匹配字形</span>
                  )}
                </div>
                {decoded.hasDecimalPoint && decoded.baseChars.length > 0 && (
                  <div className={styles.meta}>
                    含小数点，基础字形：{decoded.baseChars.join('、')}
                  </div>
                )}
                <div className={styles.meta}>
                  点亮段：{decoded.segments.length > 0 ? decoded.segments.join(' + ') : '无'}
                </div>
                <div className={styles.meta}>
                  规范掩码：{formatHex(decoded.mask)}
                  {pairs && ` · 默认共阴 ${formatHex(pairs.cathode)} · 共阳 ${formatHex(pairs.anode)}`}
                </div>
              </div>
            </div>
          )}
        </Space>
      </Card>

      <Card size="small" title="字形与共阴段码速查">
        <div className={styles.referenceGrid}>
          {GLYPH_DEFINITIONS.map((glyph) => {
            const pair = getBytePair(glyphMask(glyph.char) ?? 0);
            return (
              <div className={styles.referenceItem} key={`${glyph.char}-ref`}>
                <span className={styles.refChar}>{glyph.char === ' ' ? '␠' : glyph.char}</span>
                <span className={styles.refHex}>{formatHex(pair.cathode)}</span>
                <span className={styles.refLabel}>{glyph.label}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
