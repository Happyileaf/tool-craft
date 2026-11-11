'use client';

import React from 'react';
import { Alert, Button, Card, Input, InputNumber, Slider, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  BATCH_SAMPLE_INPUT,
  UI_MAX_NM,
  UI_MIN_NM,
  VISIBLE_MAX_NM,
  VISIBLE_MIN_NM,
  WAVELENGTH_PRESETS,
} from './constants';
import {
  batchConvert,
  buildSpectrumGradient,
  getSpectralBandMeta,
  rgbToHex,
  wavelengthToRgb,
  type RgbTriplet,
} from './utils/spectrum';
import styles from './index.module.css';

/** 批量结果表格行（合法行与非法行合并后按行号排序） */
interface BatchRow {
  /** 行号，同时作为 React key */
  key: number;
  /** 原始文本行号（从 1 开始） */
  line: number;
  /** 解析出的波长；非法行为 null */
  wavelength: number | null;
  /** 区间中文名 */
  band: string;
  /** Tag 配色；越界为 null */
  tagColor: string | null;
  /** 是否越界 */
  outOfRange: boolean;
  /** RGB 三元组；非法或越界为 null */
  rgb: RgbTriplet | null;
  /** HEX；非法或越界为 null */
  hex: string | null;
  /** 非法行错误信息；合法行为 null */
  error: string | null;
}

/** 越界或非法行的占位文本 */
const EMPTY_PLACEHOLDER = '—';

/**
 * 可见光波长 → RGB/HEX 转换器
 *
 * 支持单波长滑块 / 数字输入联动、色卡预览、区间标签、HEX 复制、
 * 批量多行对照表以及 380–750nm 渐变色带，全部计算在主线程本地完成。
 *
 * @param props - 工具组件属性，defaultInput 可预置波长或批量文本
 * @returns 波长转换交互界面
 */
const WavelengthRgbConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const initialWavelength = defaultInput && Number.isFinite(Number(defaultInput))
    ? Number(defaultInput)
    : 532;
  const [wavelength, setWavelength] = React.useState<number>(initialWavelength);
  const [batchInput, setBatchInput] = React.useState<string>(BATCH_SAMPLE_INPUT);

  /** 单波长转换结果，任何异常都降级为错误提示而非崩溃 */
  const single = React.useMemo(() => {
    try {
      return { data: wavelengthToRgb(wavelength), error: null as string | null };
    } catch (caught) {
      return { data: null, error: caught instanceof Error ? caught.message : String(caught) };
    }
  }, [wavelength]);

  /** 380–750nm 离散采样渐变色带 CSS 值 */
  const gradient = React.useMemo(() => {
    try {
      return buildSpectrumGradient();
    } catch {
      return 'none';
    }
  }, []);

  /** 批量转换结果，按行号合并合法行与非法行；异常时携带错误信息而非崩溃 */
  const batch = React.useMemo<{ rows: BatchRow[]; error: string | null }>(() => {
    try {
      const { validRows, invalidRows } = batchConvert(batchInput);
      const rows: BatchRow[] = [
        ...validRows.map((entry) => ({
          key: entry.line,
          line: entry.line,
          wavelength: entry.wavelength,
          band: entry.result.band,
          tagColor: getSpectralBandMeta(entry.wavelength).tagColor,
          outOfRange: entry.result.outOfRange,
          rgb: entry.result.rgb,
          hex: entry.result.hex,
          error: null,
        })),
        ...invalidRows.map((entry) => ({
          key: entry.line,
          line: entry.line,
          wavelength: null,
          band: EMPTY_PLACEHOLDER,
          tagColor: null,
          outOfRange: false,
          rgb: null,
          hex: null,
          error: entry.error,
        })),
      ];
      return { rows: rows.sort((a, b) => a.line - b.line), error: null };
    } catch (caught) {
      return { rows: [], error: caught instanceof Error ? caught.message : String(caught) };
    }
  }, [batchInput]);

  /**
   * 复制文本并给出反馈，剪贴板 API 不可用时由公共工具降级处理
   *
   * @param text - 待复制文本
   * @param label - 提示名称
   */
  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      message.success(`已复制${label}`);
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  const bandMeta = getSpectralBandMeta(wavelength);
  const swatchStyle: React.CSSProperties = single.data?.rgb
    ? { backgroundColor: rgbToHex(single.data.rgb) }
    : { backgroundColor: '#d9d9d9' };

  const columns: TableProps<BatchRow>['columns'] = [
    { title: '行号', dataIndex: 'line', key: 'line', width: 64 },
    {
      title: '波长 (nm)',
      dataIndex: 'wavelength',
      key: 'wavelength',
      width: 100,
      render: (value: number | null) => (
        <span className={styles.mono}>{value === null ? EMPTY_PLACEHOLDER : value}</span>
      ),
    },
    {
      title: '区间',
      dataIndex: 'band',
      key: 'band',
      width: 96,
      render: (_: string, row: BatchRow) =>
        row.tagColor ? <Tag color={row.tagColor}>{row.band}</Tag> : <span>{row.band}</span>,
    },
    {
      title: '色卡',
      key: 'swatch',
      width: 72,
      render: (_: unknown, row: BatchRow) => (
        <span
          className={styles.rowSwatch}
          style={{ backgroundColor: row.hex ?? '#d9d9d9' }}
          aria-label={row.hex ? `色卡 ${row.hex}` : '无有效颜色'}
        />
      ),
    },
    {
      title: 'RGB',
      key: 'rgb',
      render: (_: unknown, row: BatchRow) => (
        <span className={styles.mono}>
          {row.rgb ? `rgb(${row.rgb[0]}, ${row.rgb[1]}, ${row.rgb[2]})` : EMPTY_PLACEHOLDER}
        </span>
      ),
    },
    {
      title: 'HEX',
      dataIndex: 'hex',
      key: 'hex',
      render: (value: string | null) => (
        <span className={styles.mono}>{value ?? EMPTY_PLACEHOLDER}</span>
      ),
    },
    {
      title: '错误',
      dataIndex: 'error',
      key: 'error',
      render: (value: string | null) =>
        value ? <span className={styles.errorText}>{value}</span> : <span>—</span>,
    },
  ];

  return (
    <div className={styles.container}>
      {batch.error ? (
        <Alert type="error" showIcon message="批量转换异常" description={batch.error} />
      ) : null}

      <div className={styles.panels}>
        <Card className={styles.card} title="波长输入（纳米 nm）">
          <div className={styles.controls}>
            <InputNumber
              min={UI_MIN_NM}
              max={UI_MAX_NM}
              step={1}
              precision={0}
              value={wavelength}
              onChange={(value) => {
                if (typeof value === 'number') setWavelength(value);
              }}
              addonAfter="nm"
              style={{ width: '100%' }}
              aria-label="波长数值输入"
            />
            <Slider
              min={UI_MIN_NM}
              max={UI_MAX_NM}
              step={1}
              value={wavelength}
              onChange={(value) => setWavelength(value)}
              tooltip={{ formatter: (value) => `${value} nm` }}
            />
            <div className={styles.presets}>
              {WAVELENGTH_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  size="small"
                  type={wavelength === preset.value ? 'primary' : 'default'}
                  onClick={() => setWavelength(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Alert
              type="info"
              showIcon
              message={`可见光谱范围 ${VISIBLE_MIN_NM}–${VISIBLE_MAX_NM}nm（Dan Bruton 分段线性近似，gamma=0.8）；滑块延伸到 300–850nm 用于演示近紫外 / 近红外越界提示`}
            />
          </div>
        </Card>

        <Card className={styles.card} title="颜色结果">
          {single.error ? (
            <Alert type="error" showIcon message="计算失败" description={single.error} />
          ) : (
            <>
              <div className={styles.swatch} style={swatchStyle} />
              {single.data?.outOfRange ? (
                <Alert
                  style={{ marginTop: 12 }}
                  type="warning"
                  showIcon
                  message={`该波长位于${single.data.band}区域，超出 ${VISIBLE_MIN_NM}–${VISIBLE_MAX_NM}nm 可见光谱，不提供伪造颜色`}
                />
              ) : null}
              <div className={styles.swatchMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.hint}>区间</span>
                  <Tag color={bandMeta.tagColor ?? 'default'}>{bandMeta.label}</Tag>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.hint}>RGB</span>
                  <span className={styles.metaValue}>
                    {single.data?.rgb
                      ? `rgb(${single.data.rgb[0]}, ${single.data.rgb[1]}, ${single.data.rgb[2]})`
                      : EMPTY_PLACEHOLDER}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.hint}>HEX</span>
                  <span className={styles.metaValue}>{single.data?.hex ?? EMPTY_PLACEHOLDER}</span>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    disabled={!single.data?.hex}
                    onClick={() => {
                      if (single.data?.hex) {
                        void handleCopy(single.data.hex, 'HEX 值');
                      }
                    }}
                  >
                    复制
                  </Button>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.hint}>边缘衰减因子</span>
                  <span className={styles.metaValue}>
                    {single.data?.factor === null || single.data?.factor === undefined
                      ? EMPTY_PLACEHOLDER
                      : single.data.factor.toFixed(3)}
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <Card title="批量转换（每行一个波长，支持英文逗号或中文逗号分隔）">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input.TextArea
            value={batchInput}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setBatchInput(event.target.value)
            }
            rows={5}
            spellCheck={false}
            placeholder="例如：532&#10;450, 700，589"
            aria-label="批量波长输入"
          />
          <Space>
            <Button size="small" onClick={() => setBatchInput(BATCH_SAMPLE_INPUT)}>
              填入示例
            </Button>
            <Button size="small" onClick={() => setBatchInput('')}>
              清空
            </Button>
          </Space>
          <Table<BatchRow>
            size="small"
            pagination={false}
            columns={columns}
            dataSource={batch.rows}
            locale={{ emptyText: '暂无数据，请输入至少一个波长' }}
          />
        </Space>
      </Card>

      <Card title="可见光谱色带（380–750nm，每 10nm 离散采样）">
        <div className={styles.gradientBar} style={{ backgroundImage: gradient }} />
        <div className={styles.gradientLabels}>
          <span>380nm 紫</span>
          <span>440nm 蓝</span>
          <span>490nm 青</span>
          <span>510nm 绿</span>
          <span>580nm 黄</span>
          <span>645nm 红</span>
          <span>750nm</span>
        </div>
      </Card>
    </div>
  );
};

export default WavelengthRgbConverter;
