'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, Radio, Select, Space, Table, Tag } from 'antd';
import {
  COLORS,
  DIGIT_COLORS,
  MULTIPLIER_COLORS,
  TOLERANCE_COLORS,
  TEMP_COLORS,
  getColor,
  decodeBands,
  encodeOhms,
  formatOhms,
  nearestStandard,
  suggestSeries,
  type BandCount,
  type ColorName,
} from './utils/resistor';
import { DEFAULT_BANDS, DEFAULT_OHMS, BAND_SELECTOR_LABELS } from './constants';
import styles from './index.module.css';

type Mode = 'decode' | 'encode';

function colorOption(key: ColorName) {
  const info = getColor(key);
  if (!info) return { value: key, label: key };
  const extras: string[] = [];
  if (info.digit !== null) extras.push(`数字 ${info.digit}`);
  if (info.multiplier !== null) extras.push(`×${formatMultiplier(info.multiplier)}`);
  if (info.tolerance !== null) extras.push(`±${info.tolerance}%`);
  if (info.tempCoeff !== null) extras.push(`${info.tempCoeff} ppm/K`);
  return {
    value: key,
    label: (
      <span>
        <span className={styles.colorChip} style={{ backgroundColor: info.hex }} />
        {info.label}（{info.labelEn}）{extras.length > 0 ? ` · ${extras.join('，')}` : ''}
      </span>
    ),
  };
}

function formatMultiplier(m: number): string {
  if (m >= 1000) return `${m / 1000}k`;
  if (m === 0.001) return '0.001';
  return String(m);
}

function BandChips({ bands }: { bands: ColorName[] }) {
  return (
    <Space size={8} wrap>
      {bands.map((b, i) => {
        const info = getColor(b);
        return (
          <Tag key={`${b}-${i}`} color="default">
            <span className={styles.colorChip} style={{ backgroundColor: info?.hex }} />
            {info?.label}
          </Tag>
        );
      })}
    </Space>
  );
}

function ResistorSvg({ bands }: { bands: ColorName[] }) {
  const bodyLeft = 80;
  const bodyRight = 640;
  const top = 55;
  const height = 90;
  const inset = 70;
  const positions = bands.map(
    (_, i) => bodyLeft + inset + (i * (bodyRight - bodyLeft - inset * 2)) / Math.max(bands.length - 1, 1),
  );
  return (
    <svg viewBox="0 0 720 200" className={styles.resistorSvg} role="img" aria-label="电阻色环示意图">
      <line x1="0" y1="100" x2={bodyLeft} y2="100" stroke="#8c8c8c" strokeWidth="6" />
      <line x1={bodyRight} y1="100" x2="720" y2="100" stroke="#8c8c8c" strokeWidth="6" />
      <rect x={bodyLeft} y={top} width={bodyRight - bodyLeft} height={height} rx="22" fill="#E7D8BE" stroke="#B7A080" strokeWidth="2" />
      {bands.map((b, i) => (
        <g key={`${b}-${i}`}>
          <rect
            x={(positions[i] ?? bodyLeft) - 9}
            y={top}
            width="18"
            height={height}
            fill={getColor(b)?.hex ?? '#000'}
            opacity="0.92"
          />
          <text x={positions[i]} y="175" textAnchor="middle" fontSize="13" fill="rgba(0,0,0,0.65)">
            {getColor(b)?.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const TOL_OPTIONS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10].map((t) => ({
  value: t,
  label: `±${t}%`,
}));

const ResistorColorCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('decode');
  const [bandCount, setBandCount] = React.useState<BandCount>(4);
  const [bands, setBands] = React.useState<ColorName[]>(DEFAULT_BANDS[4]);
  const [ohmsText, setOhmsText] = React.useState(defaultInput || DEFAULT_OHMS);
  const [sigCount, setSigCount] = React.useState<2 | 3>(2);
  const [tolerance, setTolerance] = React.useState<number>(1);

  const handleBandCount = (count: BandCount) => {
    setBandCount(count);
    setBands(DEFAULT_BANDS[count]);
  };

  const decoded = React.useMemo(() => decodeBands(bandCount, bands), [bandCount, bands]);

  const nearest = React.useMemo(() => {
    if (decoded.error) return null;
    const series = suggestSeries(decoded.tolerancePercent);
    const r = nearestStandard(decoded.ohms, series);
    return 'error' in r ? null : r;
  }, [decoded]);

  const encoded = React.useMemo(() => {
    const ohms = Number(ohmsText);
    if (!Number.isFinite(ohms)) return null;
    return encodeOhms(ohms, sigCount, tolerance);
  }, [ohmsText, sigCount, tolerance]);

  const encodedCheck = React.useMemo(() => {
    if (!encoded || encoded.error) return null;
    return decodeBands((sigCount === 2 ? 4 : 5) as BandCount, encoded.bands);
  }, [encoded, sigCount]);

  const sigCountForBand = (index: number): number => (bandCount === 4 ? 2 : 3);

  const optionsForBand = (index: number) => {
    const sCount = sigCountForBand(index);
    if (index < sCount) return DIGIT_COLORS.map(colorOption);
    if (index === sCount) return MULTIPLIER_COLORS.map(colorOption);
    if (index === sCount + 1) return TOLERANCE_COLORS.map(colorOption);
    return TEMP_COLORS.map(colorOption);
  };

  const bandRoleLabel = (index: number): string => {
    const sCount = sigCountForBand(index);
    if (index < sCount) return '有效数字';
    if (index === sCount) return '倍率';
    if (index === sCount + 1) return '误差';
    return '温度系数';
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={[
            { value: 'decode', label: '色环 → 阻值' },
            { value: 'encode', label: '阻值 → 色环' },
          ]}
          onChange={(e) => setMode(e.target.value as Mode)}
        />
        <Tag color="blue">IEC 60062 色环标准</Tag>
        <span className={styles.hint}>4 / 5 / 6 环双向换算，全部本地计算</span>
      </div>

      {mode === 'decode' ? (
        <>
          <Card className={styles.card} title="选择色环">
            <Space direction="vertical" size={12} className={styles.fullWidth}>
              <Radio.Group
                optionType="button"
                value={bandCount}
                options={[
                  { value: 4, label: '4 环（两位数字 + 倍率 + 误差）' },
                  { value: 5, label: '5 环（三位数字，精密）' },
                  { value: 6, label: '6 环（含温度系数）' },
                ]}
                onChange={(e) => handleBandCount(e.target.value as BandCount)}
              />
              {bands.map((band, i) => (
                <div className={styles.bandRow} key={`${bandCount}-${i}`}>
                  <span className={styles.bandLabel}>
                    {BAND_SELECTOR_LABELS[i]} · {bandRoleLabel(i)}
                  </span>
                  <Select<ColorName>
                    style={{ minWidth: 320 }}
                    value={band}
                    options={optionsForBand(i)}
                    onChange={(value) => {
                      const next = [...bands];
                      next[i] = value;
                      setBands(next);
                    }}
                  />
                </div>
              ))}
            </Space>
          </Card>

          <Card className={styles.card} title="色环示意">
            <ResistorSvg bands={bands} />
          </Card>

          {decoded.error ? (
            <Alert type="error" showIcon message={decoded.error} />
          ) : (
            <Card className={styles.card} title="识读结果">
              <div className={styles.resultGrid}>
                <div className={styles.resultItem}>
                  <div className={styles.resultLabel}>标称阻值</div>
                  <div className={styles.resultValue}>{decoded.display}</div>
                </div>
                <div className={styles.resultItem}>
                  <div className={styles.resultLabel}>倍率</div>
                  <div className={styles.resultValue}>
                    ×{formatMultiplier(decoded.multiplier)}（{getColor(decoded.multiplierColor)?.label}）
                  </div>
                </div>
                <div className={styles.resultItem}>
                  <div className={styles.resultLabel}>允许误差</div>
                  <div className={styles.resultValue}>±{decoded.tolerancePercent}%</div>
                </div>
                <div className={styles.resultItem}>
                  <div className={styles.resultLabel}>阻值区间</div>
                  <div className={styles.resultValue} style={{ fontSize: 15 }}>
                    {formatOhms(decoded.minOhms)} ~ {formatOhms(decoded.maxOhms)}
                  </div>
                </div>
                {decoded.tempCoeff !== null ? (
                  <div className={styles.resultItem}>
                    <div className={styles.resultLabel}>温度系数</div>
                    <div className={styles.resultValue}>{decoded.tempCoeff} ppm/K</div>
                  </div>
                ) : null}
                {nearest ? (
                  <div className={styles.resultItem}>
                    <div className={styles.resultLabel}>{nearest.series} 标准值校验</div>
                    <div className={styles.resultValue} style={{ fontSize: 15 }}>
                      {nearest.isStandard ? (
                        <Tag color="green">标准阻值</Tag>
                      ) : (
                        <Space direction="vertical" size={0}>
                          <Tag color="orange">非标准</Tag>
                          <span style={{ fontSize: 12, fontWeight: 400 }}>
                            最近：{nearest.nearestDisplay}（{nearest.deviationPercent.toFixed(2)}%）
                          </span>
                        </Space>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          <Card className={styles.card} title="输入阻值与精度">
            <Space direction="vertical" size={12} className={styles.fullWidth}>
              <Space wrap>
                <span>阻值（Ω）</span>
                <Input
                  style={{ width: 220 }}
                  value={ohmsText}
                  spellCheck={false}
                  onChange={(e) => setOhmsText(e.target.value)}
                  placeholder="例如 4700、22000"
                />
                <span>有效数字</span>
                <Radio.Group
                  optionType="button"
                  value={sigCount}
                  options={[
                    { value: 2, label: '2 位（4 环）' },
                    { value: 3, label: '3 位（5 环）' },
                  ]}
                  onChange={(e) => setSigCount(e.target.value as 2 | 3)}
                />
                <span>公差</span>
                <Select<number>
                  style={{ width: 110 }}
                  value={tolerance}
                  options={TOL_OPTIONS}
                  onChange={setTolerance}
                />
              </Space>
              <span className={styles.hint}>
                例如 1000 Ω ±5% 两位数字 → 棕黑红金；1000 Ω ±1% 三位数字 → 棕黑黑棕棕
              </span>
            </Space>
          </Card>

          {encoded?.error ? <Alert type="error" showIcon message={encoded.error} /> : null}

          {encoded && !encoded.error ? (
            <Card className={styles.card} title="匹配色环">
              <Space direction="vertical" size={12} className={styles.fullWidth}>
                <BandChips bands={encoded.bands} />
                <ResistorSvg bands={encoded.bands} />
                {encodedCheck && !encodedCheck.error ? (
                  <Table
                    size="small"
                    pagination={false}
                    rowKey={(_, i) => String(i)}
                    dataSource={encoded.bands.map((b, i) => ({
                      key: i,
                      role: BAND_SELECTOR_LABELS[i] ?? '',
                      color: `${getColor(b)?.label}（${getColor(b)?.labelEn}）`,
                    }))}
                    columns={[
                      { title: '环序', dataIndex: 'role', key: 'role' },
                      { title: '颜色', dataIndex: 'color', key: 'color' },
                    ]}
                  />
                ) : null}
                <Alert
                  type="success"
                  showIcon
                  message={`反算校验：${encodedCheck?.display}（${encodedCheck?.ohms} Ω），±${encodedCheck?.tolerancePercent}%`}
                />
              </Space>
            </Card>
          ) : null}
        </>
      )}

      <Card className={styles.card} title="色环速查" size="small">
        <Space size={[8, 8]} wrap>
          {COLORS.map((c) => {
            const parts = [c.label];
            if (c.digit !== null) parts.push(`数${c.digit}`);
            if (c.multiplier !== null) parts.push(`×${formatMultiplier(c.multiplier)}`);
            if (c.tolerance !== null) parts.push(`±${c.tolerance}%`);
            if (c.tempCoeff !== null) parts.push(`${c.tempCoeff}ppm`);
            return (
              <Tag key={c.key}>
                <span className={styles.colorChip} style={{ backgroundColor: c.hex }} />
                {parts.join(' ')}
              </Tag>
            );
          })}
        </Space>
      </Card>
    </div>
  );
};

export default ResistorColorCalculator;
