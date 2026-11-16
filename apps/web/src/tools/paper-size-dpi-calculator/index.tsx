'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Radio,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  DEFAULT_DPI,
  DEFAULT_PIXEL_HEIGHT,
  DEFAULT_PIXEL_WIDTH,
  DEFAULT_PRESET_ID,
  DPI_PRESETS,
  PAPER_PRESETS,
  QUICK_REFERENCE_DPIS,
  QUICK_REFERENCE_PAPERS,
  UNIT_OPTIONS,
  type ConvertMode,
  type Orientation,
  type PhysicalUnit,
} from './constants';
import {
  getPresetById,
  mmToUnit,
  paperToPixels,
  pixelsToPaper,
} from './utils/paper';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 纸张尺寸与 DPI 像素换算器
 *
 * 支持「纸张 → 像素」正向换算与「像素 → 纸张」反向匹配，
 * 覆盖 ISO A/B/C 全系列与北美常用纸张，全部计算在浏览器本地完成。
 */
const PaperSizeDpiCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<ConvertMode>('paper-to-pixel');
  const [presetId, setPresetId] = React.useState<string>(DEFAULT_PRESET_ID);
  const [unit, setUnit] = React.useState<PhysicalUnit>('mm');
  const [orientation, setOrientation] = React.useState<Orientation>('portrait');
  const [dpi, setDpi] = React.useState<number>(DEFAULT_DPI);
  const [customWidth, setCustomWidth] = React.useState<number | null>(210);
  const [customHeight, setCustomHeight] = React.useState<number | null>(297);
  const [pixelWidth, setPixelWidth] = React.useState<number | null>(DEFAULT_PIXEL_WIDTH);
  const [pixelHeight, setPixelHeight] = React.useState<number | null>(DEFAULT_PIXEL_HEIGHT);

  const applyPreset = (id: string) => {
    setPresetId(id);
    const next = getPresetById(id);
    if (next) {
      setCustomWidth(next.widthMm);
      setCustomHeight(next.heightMm);
      setUnit('mm');
    }
  };

  const forward = React.useMemo(
    () =>
      paperToPixels({
        width: customWidth ?? '',
        height: customHeight ?? '',
        unit,
        dpi,
        orientation,
      }),
    [customWidth, customHeight, unit, dpi, orientation],
  );

  const reverse = React.useMemo(
    () =>
      pixelsToPaper({
        widthPx: pixelWidth ?? '',
        heightPx: pixelHeight ?? '',
        dpi,
      }),
    [pixelWidth, pixelHeight, dpi],
  );

  const activeResult = mode === 'paper-to-pixel' ? forward : reverse;

  const handleCopy = () => {
    if (activeResult.error) {
      message.error('结果存在错误，无法复制');
      return;
    }
    if (mode === 'paper-to-pixel') {
      copyToClipboard(`${forward.pixels.widthPx} × ${forward.pixels.heightPx} px`);
    } else {
      copyToClipboard(
        `${reverse.physical.widthMm.toFixed(2)} × ${reverse.physical.heightMm.toFixed(2)} mm`,
      );
    }
    message.success('已复制结果');
  };

  const quickReferenceData = React.useMemo(
    () =>
      QUICK_REFERENCE_PAPERS.map((id) => {
        const paper = getPresetById(id);
        if (!paper) {
          return null;
        }
        const row: Record<string, string | number> = { key: id, paper: paper.label };
        for (const dpiValue of QUICK_REFERENCE_DPIS) {
          const r = paperToPixels({
            width: paper.widthMm,
            height: paper.heightMm,
            unit: 'mm',
            dpi: dpiValue,
            orientation: 'portrait',
          });
          row[`dpi-${dpiValue}`] = `${r.pixels.widthPx}×${r.pixels.heightPx}`;
        }
        return row;
      }).filter((row): row is Record<string, string | number> => row !== null),
    [],
  );

  return (
    <div className={styles.container}>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={mode}
        options={[
          { value: 'paper-to-pixel', label: '纸张 → 像素' },
          { value: 'pixel-to-paper', label: '像素 → 纸张' },
        ]}
        onChange={(e) => setMode(e.target.value as ConvertMode)}
      />

      <Card title="输入参数">
        {mode === 'paper-to-pixel' ? (
          <Space direction="vertical" size="middle" className={styles.fullWidth}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>纸张预设</span>
              <Select
                showSearch
                className={styles.flexOne}
                value={presetId}
                onChange={applyPreset}
                options={PAPER_PRESETS.map((paper) => ({
                  value: paper.id,
                  label: `${paper.label}（${paper.widthMm}×${paper.heightMm} mm）`,
                }))}
                optionFilterProp="label"
              />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>自定义宽高</span>
              <InputNumber
                addonAfter={unit}
                min={1}
                value={customWidth}
                onChange={(value) => {
                  setCustomWidth(value);
                  setPresetId('custom');
                }}
                placeholder="宽"
              />
              <span className={styles.times}>×</span>
              <InputNumber
                addonAfter={unit}
                min={1}
                value={customHeight}
                onChange={(value) => {
                  setCustomHeight(value);
                  setPresetId('custom');
                }}
                placeholder="高"
              />
              <Select
                value={unit}
                style={{ width: 120 }}
                onChange={setUnit}
                options={UNIT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>方向</span>
              <Radio.Group
                optionType="button"
                value={orientation}
                options={[
                  { value: 'portrait', label: '纵向' },
                  { value: 'landscape', label: '横向' },
                ]}
                onChange={(e) => setOrientation(e.target.value as Orientation)}
              />
            </div>
          </Space>
        ) : (
          <Space direction="vertical" size="middle" className={styles.fullWidth}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>像素宽高</span>
              <InputNumber
                addonAfter="px"
                min={1}
                max={100000}
                value={pixelWidth}
                onChange={setPixelWidth}
                placeholder="宽"
              />
              <span className={styles.times}>×</span>
              <InputNumber
                addonAfter="px"
                min={1}
                max={100000}
                value={pixelHeight}
                onChange={setPixelHeight}
                placeholder="高"
              />
            </div>
          </Space>
        )}

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>DPI（打印墨点密度）</span>
          <Select
            className={styles.dpiSelect}
            value={dpi}
            onChange={setDpi}
            options={DPI_PRESETS.map((value) => ({ value, label: `${value} DPI` }))}
          />
          <InputNumber min={1} max={2400} value={dpi} onChange={(v) => v && setDpi(v)} addonAfter="DPI" />
        </div>
      </Card>

      {activeResult.error ? (
        <Alert type="error" showIcon message="输入有误" description={activeResult.error} />
      ) : (
        <Card
          title="换算结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {mode === 'paper-to-pixel' ? (
            <div className={styles.statsGrid}>
              <Statistic
                title="像素尺寸（宽 × 高）"
                value={`${forward.pixels.widthPx} × ${forward.pixels.heightPx}`}
                suffix="px"
              />
              <Statistic title="物理尺寸" value={`${forward.physical.widthMm} × ${forward.physical.heightMm}`} suffix="mm" />
              <Statistic title="总像素" value={forward.totalPixels.toLocaleString()} />
              <Statistic title="百万像素" value={forward.megapixels.toFixed(2)} suffix="MP" />
            </div>
          ) : (
            <div className={styles.statsGrid}>
              <Statistic
                title="物理尺寸（mm）"
                value={`${reverse.physical.widthMm.toFixed(2)} × ${reverse.physical.heightMm.toFixed(2)}`}
                suffix="mm"
              />
              <Statistic
                title="物理尺寸（in）"
                value={`${mmToUnit(reverse.physical.widthMm, 'in').toFixed(2)} × ${mmToUnit(reverse.physical.heightMm, 'in').toFixed(2)}`}
                suffix="in"
              />
              <Statistic title="总像素" value={reverse.totalPixels.toLocaleString()} />
              <Statistic title="百万像素" value={reverse.megapixels.toFixed(2)} suffix="MP" />
            </div>
          )}

          {mode === 'pixel-to-paper' && reverse.match ? (
            <div className={styles.matchBox}>
              <span>最接近的标准纸张：</span>
              <Tag color={reverse.match.withinTolerance ? 'green' : 'default'}>
                {reverse.match.preset.label}
                {reverse.match.orientation === 'landscape' ? '（横向）' : '（纵向）'}
              </Tag>
              <span className={styles.hint}>
                最大相对误差 {(reverse.match.relativeError * 100).toFixed(2)}%
                {reverse.match.withinTolerance ? '（近似匹配，≤2%）' : '（超过 2%，仅作参考）'}
              </span>
            </div>
          ) : null}
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        message="DPI 表示打印设备每英寸的墨点密度，用于印刷输出；与屏幕显示的 PPI（每英寸物理像素）含义不同，两者数值不能直接互换。"
      />

      <Card title="常用尺寸速查表（纵向，单位 px）">
        <Table
          size="small"
          pagination={false}
          dataSource={quickReferenceData}
          columns={[
            { title: '纸张', dataIndex: 'paper', key: 'paper' },
            ...QUICK_REFERENCE_DPIS.map((value) => ({
              title: `${value} DPI`,
              dataIndex: `dpi-${value}`,
              key: `dpi-${value}`,
            })),
          ]}
        />
      </Card>
    </div>
  );
};

export default PaperSizeDpiCalculator;
