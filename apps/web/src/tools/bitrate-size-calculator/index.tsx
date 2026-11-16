'use client';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  InputNumber,
  message,
  Segmented,
  Select,
  Slider,
  Space,
  Table,
  Tag,
} from 'antd';
import { useMemo, useState } from 'react';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  AUDIO_BITRATE_PRESETS,
  BPP_PRESETS,
  CODEC_OPTIONS,
  DEFAULT_AUDIO_BITRATE_KBPS,
  DEFAULT_CODEC,
  DEFAULT_DURATION_HOURS,
  DEFAULT_DURATION_MINUTES,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_FPS,
  DEFAULT_HEIGHT,
  DEFAULT_OVERHEAD,
  DEFAULT_QUALITY,
  DEFAULT_TARGET_SIZE_MB,
  DEFAULT_VIDEO_BITRATE_KBPS,
  DEFAULT_WIDTH,
  FPS_PRESETS,
  MODE_OPTIONS,
  OVERHEAD_MAX,
  OVERHEAD_MIN,
  QUALITY_OPTIONS,
  RESOLUTION_OPTIONS,
  RESOLUTION_PRESETS,
} from './constants';
import type { CalcMode, CodecKey, QualityLevel, ResolutionKey } from './constants';
import {
  estimateBitrateFromBpp,
  estimateSize,
  multiSegmentSummary,
  reverseBitrate,
} from './utils/bitrate';
import type { SizeEstimateResult } from './utils/bitrate';
import styles from './index.module.css';

interface SegmentRow {
  id: number;
  durationMinutes: number | null;
  videoBitrateKbps: number | null;
  audioBitrateKbps: number | null;
}

let segmentIdSeed = 1;

function createSegment(): SegmentRow {
  return {
    id: segmentIdSeed++,
    durationMinutes: 10,
    videoBitrateKbps: DEFAULT_VIDEO_BITRATE_KBPS,
    audioBitrateKbps: 0,
  };
}

/** 将秒数格式化为 时:分:秒 */
function formatHms(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '—';
  }
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

type ForwardResult =
  | { ok: true; data: SizeEstimateResult }
  | { ok: false; error: string };

interface ReverseView {
  totalBitrateKbps: number;
  videoBitrateKbps: number;
}

type ReverseResult =
  | { ok: true; data: ReverseView }
  | { ok: false; error: string };

interface SegmentView {
  totalMB: number;
  totalMiB: number;
  totalDurationSeconds: number;
  segmentCount: number;
}

type SegmentResult =
  | { ok: true; data: SegmentView }
  | { ok: false; error: string };

export default function BitrateSizeCalculator(_props: ToolComponentProps) {
  const [mode, setMode] = useState<CalcMode>('forward');

  // 正向估算输入
  const [resolutionKey, setResolutionKey] = useState<ResolutionKey>('1080p');
  const [width, setWidth] = useState<number | null>(DEFAULT_WIDTH);
  const [height, setHeight] = useState<number | null>(DEFAULT_HEIGHT);
  const [fps, setFps] = useState<number | null>(DEFAULT_FPS);
  const [codec, setCodec] = useState<CodecKey>(DEFAULT_CODEC);
  const [quality, setQuality] = useState<QualityLevel>(DEFAULT_QUALITY);
  const [manualVideoBitrate, setManualVideoBitrate] = useState<number | null>(null);
  const [audioBitrate, setAudioBitrate] = useState<number | null>(
    DEFAULT_AUDIO_BITRATE_KBPS,
  );
  const [hours, setHours] = useState<number | null>(DEFAULT_DURATION_HOURS);
  const [minutes, setMinutes] = useState<number | null>(DEFAULT_DURATION_MINUTES);
  const [seconds, setSeconds] = useState<number | null>(DEFAULT_DURATION_SECONDS);
  const [overhead, setOverhead] = useState<number>(DEFAULT_OVERHEAD);
  const [uploadBandwidth, setUploadBandwidth] = useState<number | null>(null);

  // 反向求解输入
  const [targetSizeMB, setTargetSizeMB] = useState<number | null>(
    DEFAULT_TARGET_SIZE_MB,
  );
  const [reverseDurationMinutes, setReverseDurationMinutes] = useState<number | null>(
    30,
  );
  const [reverseAudioBitrate, setReverseAudioBitrate] = useState<number | null>(
    DEFAULT_AUDIO_BITRATE_KBPS,
  );
  const [reverseOverhead, setReverseOverhead] = useState<number>(DEFAULT_OVERHEAD);

  // 多片段输入
  const [segments, setSegments] = useState<SegmentRow[]>(() => [
    createSegment(),
    createSegment(),
  ]);
  const [segmentOverhead, setSegmentOverhead] = useState<number>(DEFAULT_OVERHEAD);

  /** 依据 bpp 表自动估算的视频码率（kbps），参数不完整时为 null */
  const autoVideoBitrate = useMemo<number | null>(() => {
    if (resolutionKey === 'custom' && (width === null || height === null)) {
      return null;
    }
    const preset = RESOLUTION_PRESETS[resolutionKey as keyof typeof RESOLUTION_PRESETS];
    const finalWidth = resolutionKey === 'custom' ? (width as number) : preset.width;
    const finalHeight = resolutionKey === 'custom' ? (height as number) : preset.height;
    if (fps === null) {
      return null;
    }
    try {
      return estimateBitrateFromBpp(finalWidth, finalHeight, fps, BPP_PRESETS[codec][quality]);
    } catch {
      return null;
    }
  }, [codec, fps, height, quality, resolutionKey, width]);

  const effectiveVideoBitrate = manualVideoBitrate ?? autoVideoBitrate;

  const durationSeconds = useMemo(
    () => (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0),
    [hours, minutes, seconds],
  );

  const forwardResult = useMemo<ForwardResult>(() => {
    if (mode !== 'forward') {
      return { ok: false, error: '' };
    }
    if (effectiveVideoBitrate === null) {
      return { ok: false, error: '请填写完整的分辨率与帧率参数' };
    }
    if (audioBitrate === null) {
      return { ok: false, error: '请填写音频码率' };
    }
    if (durationSeconds <= 0) {
      return { ok: false, error: '时长必须大于 0' };
    }
    try {
      const data = estimateSize({
        videoBitrateKbps: effectiveVideoBitrate,
        audioBitrateKbps: audioBitrate,
        durationSeconds,
        overheadPercent: overhead,
        uploadBandwidthKbps:
          uploadBandwidth !== null && uploadBandwidth > 0
            ? uploadBandwidth
            : undefined,
      });
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [
    mode,
    effectiveVideoBitrate,
    audioBitrate,
    durationSeconds,
    overhead,
    uploadBandwidth,
  ]);

  const reverseResult = useMemo<ReverseResult>(() => {
    if (mode !== 'reverse') {
      return { ok: false, error: '' };
    }
    if (targetSizeMB === null) {
      return { ok: false, error: '请填写目标体积' };
    }
    if (reverseDurationMinutes === null) {
      return { ok: false, error: '请填写时长' };
    }
    if (reverseAudioBitrate === null) {
      return { ok: false, error: '请填写音频码率' };
    }
    try {
      const data = reverseBitrate({
        targetSizeMB,
        durationSeconds: reverseDurationMinutes * 60,
        audioBitrateKbps: reverseAudioBitrate,
        overheadPercent: reverseOverhead,
      });
      return {
        ok: true,
        data: {
          totalBitrateKbps: data.totalBitrateKbps,
          videoBitrateKbps: data.videoBitrateKbps,
        },
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [
    mode,
    reverseAudioBitrate,
    reverseDurationMinutes,
    reverseOverhead,
    targetSizeMB,
  ]);

  const segmentResult = useMemo<SegmentResult>(() => {
    if (mode !== 'segments') {
      return { ok: false, error: '' };
    }
    try {
      const summary = multiSegmentSummary(
        segments.map((row) => ({
          videoBitrateKbps: row.videoBitrateKbps ?? 0,
          audioBitrateKbps: row.audioBitrateKbps ?? 0,
          durationSeconds: (row.durationMinutes ?? 0) * 60,
          overheadPercent: segmentOverhead,
        })),
      );
      return {
        ok: true,
        data: {
          totalMB: summary.totalMB,
          totalMiB: summary.totalMiB,
          totalDurationSeconds: summary.totalDurationSeconds,
          segmentCount: summary.segmentCount,
        },
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [mode, segmentOverhead, segments]);

  const updateSegment = (id: number, patch: Partial<Omit<SegmentRow, 'id'>>) => {
    setSegments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const removeSegment = (id: number) => {
    setSegments((prev) => prev.filter((row) => row.id !== id));
  };

  const handleCopyForward = async () => {
    if (!forwardResult.ok) {
      return;
    }
    const { data } = forwardResult;
    await copyToClipboard(
      [
        `总码率：${(data.totalBitrateKbps / 1000).toFixed(3)} Mbps`,
        `文件体积：${data.sizeMB.toFixed(1)} MB / ${data.sizeMiB.toFixed(1)} MiB`,
        `每分钟体积：${data.perMinuteMB.toFixed(1)} MB`,
      ].join('\n'),
    );
    message.success('结果已复制');
  };

  const bppTableData = CODEC_OPTIONS.map((option) => ({
    key: option.value,
    codec: option.label,
    low: BPP_PRESETS[option.value].low,
    medium: BPP_PRESETS[option.value].medium,
    high: BPP_PRESETS[option.value].high,
  }));

  return (
    <div className={styles.container}>
      <Alert
        type="warning"
        showIcon
        message="结果为估算值，实际体积因编码器实现与画面复杂度而异"
      />

      <Card>
        <Segmented<CalcMode>
          value={mode}
          onChange={(value) => setMode(value)}
          options={MODE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
        />
      </Card>

      {mode === 'forward' ? (
        <>
          <Card title="视频与编码参数">
            <div className={styles.inputs}>
              <label className={styles.field}>
                <span className={styles.label}>分辨率预设</span>
                <Select<ResolutionKey>
                  value={resolutionKey}
                  onChange={(value) => setResolutionKey(value)}
                  options={RESOLUTION_OPTIONS.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                  className={styles.control}
                />
              </label>
              {resolutionKey === 'custom' ? (
                <>
                  <label className={styles.field}>
                    <span className={styles.label}>宽度（px）</span>
                    <InputNumber
                      min={1}
                      step={2}
                      value={width}
                      onChange={setWidth}
                      className={styles.control}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>高度（px）</span>
                    <InputNumber
                      min={1}
                      step={2}
                      value={height}
                      onChange={setHeight}
                      className={styles.control}
                    />
                  </label>
                </>
              ) : null}
              <label className={styles.field}>
                <span className={styles.label}>帧率（fps）</span>
                <Select<number>
                  value={fps}
                  onChange={setFps}
                  options={FPS_PRESETS.map((value) => ({ label: `${value}`, value }))}
                  className={styles.control}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>编码器</span>
                <Select<CodecKey>
                  value={codec}
                  onChange={setCodec}
                  options={CODEC_OPTIONS.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                  className={styles.control}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>bpp 画质档位</span>
                <Select<QualityLevel>
                  value={quality}
                  onChange={setQuality}
                  options={QUALITY_OPTIONS.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                  className={styles.control}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>视频码率（kbps，可手动覆盖）</span>
                <InputNumber
                  min={1}
                  step={100}
                  placeholder={autoVideoBitrate === null ? '自动估算' : autoVideoBitrate.toFixed(1)}
                  value={manualVideoBitrate}
                  onChange={setManualVideoBitrate}
                  className={styles.control}
                />
              </label>
            </div>
            <Space wrap>
              <Tag color="blue">
                bpp 自动估算：{autoVideoBitrate === null ? '—' : `${autoVideoBitrate.toFixed(2)} kbps`}
              </Tag>
              <Tag>
                当前生效：
                {effectiveVideoBitrate === null
                  ? '—'
                  : `${effectiveVideoBitrate.toFixed(2)} kbps（${(effectiveVideoBitrate / 1000).toFixed(3)} Mbps）`}
              </Tag>
              {manualVideoBitrate !== null ? (
                <Button size="small" onClick={() => setManualVideoBitrate(null)}>
                  恢复自动估算
                </Button>
              ) : null}
            </Space>
          </Card>

          <Card title="音频、时长与开销">
            <div className={styles.inputs}>
              <label className={styles.field}>
                <span className={styles.label}>音频码率（kbps，0 表示无音频）</span>
                <Select<number>
                  value={audioBitrate}
                  onChange={setAudioBitrate}
                  options={AUDIO_BITRATE_PRESETS.map((value) => ({
                    label: value === 0 ? '无音频（0）' : `${value}`,
                    value,
                  }))}
                  className={styles.control}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>时长（时）</span>
                <InputNumber
                  min={0}
                  step={1}
                  precision={0}
                  value={hours}
                  onChange={setHours}
                  className={styles.durationInput}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>时长（分）</span>
                <InputNumber
                  min={0}
                  max={59}
                  step={1}
                  precision={0}
                  value={minutes}
                  onChange={setMinutes}
                  className={styles.durationInput}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>时长（秒）</span>
                <InputNumber
                  min={0}
                  max={59}
                  step={1}
                  precision={0}
                  value={seconds}
                  onChange={setSeconds}
                  className={styles.durationInput}
                />
              </label>
              <label className={styles.fieldWide}>
                <span className={styles.label}>上行带宽（kbps，可选，用于估算上传耗时）</span>
                <InputNumber
                  min={1}
                  step={100}
                  placeholder="如 1000"
                  value={uploadBandwidth}
                  onChange={setUploadBandwidth}
                  className={styles.control}
                />
              </label>
            </div>
            <label className={styles.sliderField}>
              <span className={styles.label}>容器开销：{overhead}%</span>
              <Slider
                min={OVERHEAD_MIN}
                max={OVERHEAD_MAX}
                step={0.5}
                value={overhead}
                onChange={setOverhead}
              />
            </label>
          </Card>

          <Card
            title="估算结果"
            extra={
              forwardResult.ok ? (
                <Button size="small" onClick={handleCopyForward}>
                  复制结果
                </Button>
              ) : null
            }
          >
            {forwardResult.ok ? (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>总码率</span>
                  <span className={styles.value}>
                    {(forwardResult.data.totalBitrateKbps / 1000).toFixed(3)} Mbps
                  </span>
                  <span className={styles.sub}>
                    {forwardResult.data.totalBitrateKbps.toFixed(2)} kbps
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>文件体积（十进制）</span>
                  <span className={styles.value}>{forwardResult.data.sizeMB.toFixed(1)} MB</span>
                  <span className={styles.sub}>1 MB = 1,000,000 字节</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>文件体积（二进制）</span>
                  <span className={styles.value}>
                    {forwardResult.data.sizeMiB.toFixed(1)} MiB
                  </span>
                  <span className={styles.sub}>1 MiB = 1,048,576 字节</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>每分钟体积</span>
                  <span className={styles.value}>
                    {forwardResult.data.perMinuteMB.toFixed(1)} MB
                  </span>
                  <span className={styles.sub}>已应用容器开销</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>预计上传耗时</span>
                  <span className={styles.value}>
                    {forwardResult.data.uploadSeconds === undefined
                      ? '—'
                      : formatHms(forwardResult.data.uploadSeconds)}
                  </span>
                  <span className={styles.sub}>
                    {forwardResult.data.uploadSeconds === undefined
                      ? '未填写上行带宽'
                      : `${forwardResult.data.uploadSeconds.toFixed(0)} 秒`}
                  </span>
                </div>
              </div>
            ) : (
              <Alert type="error" showIcon message={forwardResult.error} />
            )}
          </Card>
        </>
      ) : null}

      {mode === 'reverse' ? (
        <Card title="反向求解参数">
          <div className={styles.inputs}>
            <label className={styles.field}>
              <span className={styles.label}>目标体积（MB）</span>
              <InputNumber
                min={0}
                step={50}
                value={targetSizeMB}
                onChange={setTargetSizeMB}
                className={styles.control}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>时长（分钟）</span>
              <InputNumber
                min={0}
                step={1}
                value={reverseDurationMinutes}
                onChange={setReverseDurationMinutes}
                className={styles.control}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>音频码率（kbps）</span>
              <Select<number>
                value={reverseAudioBitrate}
                onChange={setReverseAudioBitrate}
                options={AUDIO_BITRATE_PRESETS.map((value) => ({
                  label: value === 0 ? '无音频（0）' : `${value}`,
                  value,
                }))}
                className={styles.control}
              />
            </label>
          </div>
          <label className={styles.sliderField}>
            <span className={styles.label}>容器开销：{reverseOverhead}%</span>
            <Slider
              min={OVERHEAD_MIN}
              max={OVERHEAD_MAX}
              step={0.5}
              value={reverseOverhead}
              onChange={setReverseOverhead}
            />
          </label>

          <Card type="inner" title="求解结果" className={styles.resultInner}>
            {reverseResult.ok ? (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>可用总码率</span>
                  <span className={styles.value}>
                    {(reverseResult.data.totalBitrateKbps / 1000).toFixed(3)} Mbps
                  </span>
                  <span className={styles.sub}>
                    {reverseResult.data.totalBitrateKbps.toFixed(2)} kbps
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>推荐视频码率</span>
                  <span className={styles.value}>
                    {(reverseResult.data.videoBitrateKbps / 1000).toFixed(3)} Mbps
                  </span>
                  <span className={styles.sub}>
                    {reverseResult.data.videoBitrateKbps.toFixed(2)} kbps（已扣除音频）
                  </span>
                </div>
              </div>
            ) : (
              <Alert type="error" showIcon message={reverseResult.error} />
            )}
          </Card>
        </Card>
      ) : null}

      {mode === 'segments' ? (
        <Card
          title="多片段汇总"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setSegments((prev) => [...prev, createSegment()])}
            >
              添加片段
            </Button>
          }
        >
          <label className={styles.sliderField}>
            <span className={styles.label}>统一容器开销：{segmentOverhead}%</span>
            <Slider
              min={OVERHEAD_MIN}
              max={OVERHEAD_MAX}
              step={0.5}
              value={segmentOverhead}
              onChange={setSegmentOverhead}
            />
          </label>
          <Table<SegmentRow>
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={segments}
            columns={[
              {
                title: '片段',
                width: 70,
                render: (_value, _row, index) => `#${index + 1}`,
              },
              {
                title: '时长（分钟）',
                render: (_value, row) => (
                  <InputNumber
                    min={0}
                    step={1}
                    value={row.durationMinutes}
                    onChange={(value) => updateSegment(row.id, { durationMinutes: value })}
                  />
                ),
              },
              {
                title: '视频码率（kbps）',
                render: (_value, row) => (
                  <InputNumber
                    min={0}
                    step={100}
                    value={row.videoBitrateKbps}
                    onChange={(value) => updateSegment(row.id, { videoBitrateKbps: value })}
                  />
                ),
              },
              {
                title: '音频码率（kbps）',
                render: (_value, row) => (
                  <InputNumber
                    min={0}
                    step={32}
                    value={row.audioBitrateKbps}
                    onChange={(value) => updateSegment(row.id, { audioBitrateKbps: value })}
                  />
                ),
              },
              {
                title: '操作',
                width: 80,
                render: (_value, row) => (
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    disabled={segments.length <= 1}
                    onClick={() => removeSegment(row.id)}
                  />
                ),
              },
            ]}
          />
          <Card type="inner" title="汇总结果" className={styles.resultInner}>
            {segmentResult.ok ? (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>总片段数</span>
                  <span className={styles.value}>{segmentResult.data.segmentCount}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>总体积（MB）</span>
                  <span className={styles.value}>{segmentResult.data.totalMB.toFixed(1)}</span>
                  <span className={styles.sub}>十进制</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>总体积（MiB）</span>
                  <span className={styles.value}>
                    {segmentResult.data.totalMiB.toFixed(1)}
                  </span>
                  <span className={styles.sub}>二进制</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>总时长</span>
                  <span className={styles.value}>{formatHms(segmentResult.data.totalDurationSeconds)}</span>
                  <span className={styles.sub}>
                    {segmentResult.data.totalDurationSeconds.toFixed(0)} 秒
                  </span>
                </div>
              </div>
            ) : (
              <Alert type="error" showIcon message={segmentResult.error} />
            )}
          </Card>
        </Card>
      ) : null}

      <Card title="说明与参考">
        <Alert
          type="info"
          showIcon
          className={styles.infoAlert}
          message="bpp（bits per pixel）档位参考，估算码率 = 宽 × 高 × 帧率 × bpp ÷ 1000（kbps）"
        />
        <Table
          rowKey="codec"
          size="small"
          pagination={false}
          dataSource={bppTableData}
          columns={[
            { title: '编码器', dataIndex: 'codec' },
            { title: '低画质 bpp', dataIndex: 'low' },
            { title: '中画质 bpp', dataIndex: 'medium' },
            { title: '高画质 bpp', dataIndex: 'high' },
          ]}
        />
        <ul className={styles.notes}>
          <li>
            MB 为十进制单位（1 MB = 1,000,000 字节），MiB 为二进制单位（1 MiB = 1,048,576
            字节）；操作系统常用 MiB 却标注为 MB，两者约相差 4.9%。
          </li>
          <li>
            容器开销模拟 MP4/MKV 等封装与元数据占用，限定 0–10%，最终体积 = 基础体积 ×
            (1 + 开销%)。
          </li>
          <li>所有运算均在浏览器本地完成，不上传任何数据，可离线使用，无隐私泄露风险。</li>
        </ul>
      </Card>
    </div>
  );
}
