'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Radio,
  Segmented,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  decodeDifferentialManchester,
  decodeManchester,
  encodeDifferentialManchester,
  encodeManchester,
  timingParams,
  type CodeResult,
  type DecodeResult,
  type Level,
} from './utils/manchester';
import {
  BITS_PLACEHOLDER,
  DEFAULT_BITRATE,
  DEFAULT_BITS,
  INITIAL_LEVEL_OPTIONS,
  LEVELS_PLACEHOLDER,
  LONG_INPUT_THRESHOLD,
  MODE_OPTIONS,
  SCHEME_OPTIONS,
  WAVEFORM_MAX_BITS,
  type CodecMode,
  type LineScheme,
} from './constants';
import styles from './index.module.css';

interface WaveformProps {
  bits: string;
  levels: Level[];
  schemeLabel: string;
}

const ROW_HEIGHT = 56;
const LABEL_WIDTH = 88;
const HALF_CELL = 24;
const WAVE_TOP = 10;
const WAVE_BOTTOM = 38;

function stepPath(levels: Level[], cellWidth: number): string {
  if (levels.length === 0) {
    return '';
  }
  const yOf = (level: Level): number => (level === 'H' ? WAVE_TOP : WAVE_BOTTOM);
  let path = `M 0 ${yOf(levels[0]!)}`;
  for (let i = 0; i < levels.length; i += 1) {
    const x = (i + 1) * cellWidth;
    path += ` H ${x}`;
    if (i + 1 < levels.length && levels[i + 1] !== levels[i]) {
      path += ` V ${yOf(levels[i + 1]!)}`;
    }
  }
  return path;
}

/** 纯手写内联 SVG：NRZ 原始数据、时钟 Clock 与线路波形三行对照，标注位边界 */
const Waveform: React.FC<WaveformProps> = ({ bits, levels, schemeLabel }) => {
  const renderBits = bits.slice(0, WAVEFORM_MAX_BITS);
  const bitCount = renderBits.length;
  const renderLevels = levels.slice(0, bitCount * 2);
  const cellWidth = HALF_CELL * 2;
  const width = LABEL_WIDTH + bitCount * cellWidth;
  const height = ROW_HEIGHT * 3;

  const nrzLevels: Level[] = renderBits.split('').flatMap((bit) => [bit === '1' ? 'H' : 'L', bit === '1' ? 'H' : 'L']);
  const clockLevels: Level[] = renderBits.split('').flatMap(() => ['L', 'H'] as Level[]);

  const rows: Array<{ label: string; levels: Level[]; color: string }> = [
    { label: 'NRZ 数据', levels: nrzLevels, color: '#2563eb' },
    { label: '时钟 Clock', levels: clockLevels, color: '#7c3aed' },
    { label: schemeLabel, levels: renderLevels, color: '#059669' },
  ];

  return (
    <div className={styles.waveformScroll}>
      <svg width={width} height={height} className={styles.waveformSvg} role="img" aria-label="线路编码波形对照">
        {rows.map((row, rowIndex) => {
          const offsetY = rowIndex * ROW_HEIGHT;
          return (
            <g key={row.label} transform={`translate(${LABEL_WIDTH}, ${offsetY})`}>
              <text x={-LABEL_WIDTH + 8} y={26} className={styles.waveLabel}>
                {row.label}
              </text>
              <line x1={0} y1={WAVE_TOP - 6} x2={bitCount * cellWidth} y2={WAVE_TOP - 6} className={styles.waveAxis} />
              <line x1={0} y1={WAVE_BOTTOM + 6} x2={bitCount * cellWidth} y2={WAVE_BOTTOM + 6} className={styles.waveAxis} />
              <path d={stepPath(row.levels, HALF_CELL)} fill="none" stroke={row.color} strokeWidth={2} />
              {Array.from({ length: bitCount + 1 }).map((_, bitIndex) => (
                <line
                  key={bitIndex}
                  x1={bitIndex * cellWidth}
                  y1={0}
                  x2={bitIndex * cellWidth}
                  y2={ROW_HEIGHT - 14}
                  className={styles.waveBoundary}
                />
              ))}
            </g>
          );
        })}
        {renderBits.split('').map((bit, bitIndex) => (
          <text
            key={bitIndex}
            x={LABEL_WIDTH + bitIndex * cellWidth + cellWidth / 2}
            y={height - 2}
            textAnchor="middle"
            className={styles.waveIndex}
          >
            {bit}
          </text>
        ))}
      </svg>
    </div>
  );
};

/**
 * 曼彻斯特/差分曼彻斯特线路编解码器，所有运算在浏览器本地完成
 */
const ManchesterLineCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecMode>('encode');
  const [scheme, setScheme] = React.useState<LineScheme>('ieee');
  const [initialLevel, setInitialLevel] = React.useState<Level>('L');
  const [bitsInput, setBitsInput] = React.useState<string>(defaultInput || DEFAULT_BITS);
  const [levelsInput, setLevelsInput] = React.useState<string>('LH HL LH HL HL LH HL LH');
  const [bitrate, setBitrate] = React.useState<number>(DEFAULT_BITRATE);

  const encoded = React.useMemo<{ output: CodeResult | null; error: string | null }>(() => {
    try {
      if (scheme === 'differential') {
        return { output: encodeDifferentialManchester(bitsInput, initialLevel), error: null };
      }
      return { output: encodeManchester(bitsInput, scheme), error: null };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '编码失败' };
    }
  }, [bitsInput, scheme, initialLevel]);

  const decoded = React.useMemo<{ output: DecodeResult | null; error: string | null }>(() => {
    try {
      if (scheme === 'differential') {
        return { output: decodeDifferentialManchester(levelsInput, initialLevel), error: null };
      }
      return { output: decodeManchester(levelsInput, scheme), error: null };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '解码失败' };
    }
  }, [levelsInput, scheme, initialLevel]);

  const timing = React.useMemo<{ text: string; error: string | null }>(() => {
    try {
      const params = timingParams(bitrate);
      return {
        text: `码元宽度 ${params.symbolWidthSeconds.toExponential(3)} s（${params.symbolWidthUs.toFixed(3)} µs / ${(
          params.symbolWidthUs * 1000
        ).toFixed(1)} ns），曼彻斯特主瓣带宽提示 ≈ ${params.minBandwidthHz.toLocaleString()} Hz`,
        error: null,
      };
    } catch (caught) {
      return { text: '', error: caught instanceof Error ? caught.message : '时序参数计算失败' };
    }
  }, [bitrate]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const schemeLabel = SCHEME_OPTIONS.find((option) => option.value === scheme)?.label ?? '';
  const activeOutput = mode === 'encode' ? encoded.output : decoded.output;
  const activeError = mode === 'encode' ? encoded.error : decoded.error;
  const waveformBits =
    mode === 'encode' ? (encoded.output ? bitsInput.replace(/0b/gi, '').replace(/\s+/g, '') : '') : decoded.output?.bits ?? '';
  const waveformLevels = activeOutput
    ? (activeOutput.levels.split(' ').filter(Boolean) as Level[])
    : [];
  const inputBitCount = (mode === 'encode' ? bitsInput : decoded.output?.bits ?? '').replace(/0b/gi, '').replace(/\s+/g, '').length;
  const truncated = inputBitCount > WAVEFORM_MAX_BITS;
  const longInput = inputBitCount > LONG_INPUT_THRESHOLD;

  const encodeColumns = [
    { title: '位序号', dataIndex: 'index', width: 80, render: (_: unknown, __: unknown, index: number) => index + 1 },
    { title: '比特', dataIndex: 'bit', width: 80, render: (value: string) => <Tag color={value === '1' ? 'blue' : 'default'}>{value}</Tag> },
    {
      title: '双相电平',
      dataIndex: 'pair',
      render: (value: string, record: { startTransition?: boolean }) => (
        <Space>
          <span className={styles.monoText}>{value}</span>
          {record.startTransition !== undefined && (
            <Tag color={record.startTransition ? 'orange' : 'green'}>
              位起始{record.startTransition ? '跳变（0）' : '不跳变（1）'}
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  const decodeColumns = [
    { title: '位序号', dataIndex: 'index', width: 80 },
    { title: '还原比特', dataIndex: 'bit', width: 100, render: (value: string) => <Tag color={value === '1' ? 'blue' : 'default'}>{value}</Tag> },
    { title: '电平对', dataIndex: 'pair', width: 100, render: (value: string) => <span className={styles.monoText}>{value}</span> },
    { title: '判定依据', dataIndex: 'reason' },
  ];

  return (
    <div className={styles.container}>
      <Card title="曼彻斯特 / 差分曼彻斯特线路编解码器">
        <div className={styles.fieldRow}>
          <div>
            <span className={styles.label}>工作模式</span>
            <Segmented options={MODE_OPTIONS} value={mode} onChange={(value) => setMode(value as CodecMode)} />
          </div>
          <div>
            <span className={styles.label}>编码约定</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={SCHEME_OPTIONS}
              value={scheme}
              onChange={(event) => setScheme(event.target.value as LineScheme)}
            />
          </div>
          {scheme === 'differential' && (
            <div>
              <span className={styles.label}>初始电平（第一位前置电平）</span>
              <Radio.Group
                optionType="button"
                options={INITIAL_LEVEL_OPTIONS}
                value={initialLevel}
                onChange={(event) => setInitialLevel(event.target.value as Level)}
              />
            </div>
          )}
        </div>
      </Card>

      {mode === 'encode' ? (
        <Card title="编码：比特串 → 双相电平序列">
          <span className={styles.label}>比特串</span>
          <Input.TextArea
            value={bitsInput}
            onChange={(event) => setBitsInput(event.target.value)}
            rows={4}
            className={styles.inputArea}
            placeholder={BITS_PLACEHOLDER}
          />
          <div className={styles.fieldRow} style={{ marginTop: 10 }}>
            <div>
              <span className={styles.label}>比特率（bit/s）</span>
              <InputNumber
                min={1}
                precision={0}
                value={bitrate}
                onChange={(value) => setBitrate(value ?? DEFAULT_BITRATE)}
                style={{ width: 180 }}
              />
            </div>
          </div>
          <Space wrap style={{ margin: '10px 0' }}>
            <Button icon={<ReloadOutlined />} onClick={() => setBitsInput(DEFAULT_BITS)}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setBitsInput('')}>
              清空
            </Button>
          </Space>

          {encoded.error ? (
            <Alert type="error" showIcon message="编码失败" description={encoded.error} />
          ) : (
            encoded.output && (
              <div className={styles.resultCard}>
                <div className={styles.hexBlock}>
                  <div className={styles.hexHeader}>
                    <span>双相电平序列（{encoded.output.pairs.length} 位 → {encoded.output.pairs.length * 2} 个电平）</span>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copy(encoded.output!.levels)}>
                      复制
                    </Button>
                  </div>
                  <code className={styles.hexText}>{encoded.output.levels}</code>
                </div>

                {timing.error ? (
                  <Alert type="error" showIcon message="时序参数错误" description={timing.error} />
                ) : (
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="时序参数">{timing.text}</Descriptions.Item>
                  </Descriptions>
                )}

                <div>
                  <span className={styles.label}>逐位映射{truncated ? `（波形仅渲染前 ${WAVEFORM_MAX_BITS} 位，下表展示全部 ${encoded.output.perBit.length} 位）` : ''}</span>
                  <Table
                    size="small"
                    rowKey={(record) => `${record.bit}-${record.pair}-${record.startTransition ?? ''}`}
                    pagination={false}
                    columns={encodeColumns}
                    dataSource={encoded.output.perBit}
                    scroll={{ y: 320 }}
                  />
                </div>
              </div>
            )
          )}
        </Card>
      ) : (
        <Card title="解码：双相电平序列 → 比特串">
          <span className={styles.label}>电平序列</span>
          <Input.TextArea
            value={levelsInput}
            onChange={(event) => setLevelsInput(event.target.value)}
            rows={4}
            className={styles.inputArea}
            placeholder={LEVELS_PLACEHOLDER}
          />
          <Space wrap style={{ margin: '10px 0' }}>
            <Button icon={<ReloadOutlined />} onClick={() => setLevelsInput('LH HL LH HL HL LH HL LH')}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setLevelsInput('')}>
              清空
            </Button>
          </Space>

          {decoded.error ? (
            <Alert type="error" showIcon message="解码失败" description={decoded.error} />
          ) : (
            decoded.output && (
              <div className={styles.resultCard}>
                <div className={styles.hexBlock}>
                  <div className={styles.hexHeader}>
                    <span>还原比特（{decoded.output.bits.length} 位）</span>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copy(decoded.output!.bits)}>
                      复制
                    </Button>
                  </div>
                  <code className={styles.hexText}>{decoded.output.bits}</code>
                </div>
                <div>
                  <span className={styles.label}>逐位判定</span>
                  <Table
                    size="small"
                    rowKey={(record) => `${record.index}-${record.pair}`}
                    pagination={false}
                    columns={decodeColumns}
                    dataSource={decoded.output.perBit}
                    scroll={{ y: 320 }}
                  />
                </div>
              </div>
            )
          )}
        </Card>
      )}

      <Card title="波形对照（NRZ / 时钟 / 线路码）">
        {activeError || !activeOutput ? (
          <Alert type="warning" showIcon message="当前输入无法生成波形" description={activeError ?? '请检查输入'} />
        ) : waveformBits.length === 0 ? (
          <Alert type="info" showIcon message="暂无数据" description="请输入比特串或电平序列" />
        ) : (
          <>
            {longInput && (
              <Alert
                style={{ marginBottom: 12 }}
                type="info"
                showIcon
                message={`输入超过 ${LONG_INPUT_THRESHOLD} 位，编解码仍完整计算；波形仅渲染前 ${WAVEFORM_MAX_BITS} 位`}
              />
            )}
            {truncated && !longInput && (
              <Alert
                style={{ marginBottom: 12 }}
                type="info"
                showIcon
                message={`共 ${inputBitCount} 位，波形仅渲染前 ${WAVEFORM_MAX_BITS} 位`}
              />
            )}
            <Waveform bits={waveformBits} levels={waveformLevels} schemeLabel={schemeLabel} />
          </>
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="约定差异与差分特性"
        description={
          <div className={styles.hint}>
            <p>
              IEEE 802.3（以太网）约定：比特 0 编码为高→低（HL），比特 1 编码为低→高（LH）；
              Thomas 约定极性完全相反（0→LH、1→HL），两种约定的每位中间都必有一次跳变，接收端据此自同步。
            </p>
            <p>
              差分曼彻斯特不依赖绝对电平：比特 1 在位起始处不跳变、比特 0 在位起始处跳变，中间恒有跳变。
              即使线路极性整体反转，只要对比相邻码元边界即可正确还原，因此具备抗极性反转能力。
            </p>
            <p>本工具所有编解码、时序计算与波形绘制均在本机浏览器主线程完成，不上传任何数据。</p>
          </div>
        }
      />
    </div>
  );
};

export default ManchesterLineCodec;
