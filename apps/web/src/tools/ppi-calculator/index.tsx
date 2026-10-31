'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, InputNumber, Space, Statistic, Table, Tag } from 'antd';
import {
  DEFAULT_DIAGONAL_INCH,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  SCREEN_PRESETS,
} from './constants';
import {
  DEVICE_REFERENCES,
  calculatePpi,
  densityTier,
  describeAspectRatio,
  formatMm,
} from './utils/ppi';
import styles from './index.module.css';

/**
 * 屏幕 PPI / 像素密度计算器
 *
 * @returns PPI 计算交互界面
 */
const PpiCalculator: React.FC<ToolComponentProps> = () => {
  const [widthPx, setWidthPx] = React.useState<number>(DEFAULT_WIDTH);
  const [heightPx, setHeightPx] = React.useState<number>(DEFAULT_HEIGHT);
  const [diagonalInch, setDiagonalInch] = React.useState<number>(DEFAULT_DIAGONAL_INCH);

  const outcome = React.useMemo(() => {
    try {
      return {
        result: calculatePpi(widthPx, heightPx, diagonalInch),
        ratioLabel: describeAspectRatio(widthPx, heightPx),
        error: undefined as string | undefined,
      };
    } catch (error) {
      return {
        result: undefined,
        ratioLabel: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [widthPx, heightPx, diagonalInch]);

  return (
    <div className={styles.container}>
      <Card title="屏幕 PPI / 像素密度计算器">
        <p className={styles.hint}>
          输入屏幕分辨率（像素）与对角线长度（英寸），计算每英寸像素数 PPI、每厘米像素数 PPCM、像素点距、
          物理宽高与面积。计算基于正方形像素假设，全部在本地完成，不上传任何数据。
        </p>
        <Space align="center" wrap size="middle">
          <span className={styles.label}>横向像素</span>
          <InputNumber
            min={1}
            step={1}
            precision={0}
            value={widthPx}
            onChange={(value) => setWidthPx(typeof value === 'number' ? value : 0)}
            style={{ width: 120 }}
          />
          <span className={styles.label}>纵向像素</span>
          <InputNumber
            min={1}
            step={1}
            precision={0}
            value={heightPx}
            onChange={(value) => setHeightPx(typeof value === 'number' ? value : 0)}
            style={{ width: 120 }}
          />
          <span className={styles.label}>对角线（英寸）</span>
          <InputNumber
            min={0.1}
            step={0.1}
            value={diagonalInch}
            onChange={(value) => setDiagonalInch(typeof value === 'number' ? value : 0)}
            style={{ width: 140 }}
          />
        </Space>
        <div className={styles.presetRow}>
          {SCREEN_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              size="small"
              onClick={() => {
                setWidthPx(preset.width);
                setHeightPx(preset.height);
                setDiagonalInch(preset.diagonal);
              }}
            >
              {preset.name}
            </Button>
          ))}
        </div>
        {outcome.error ? (
          <Alert style={{ marginTop: 12 }} type="warning" showIcon message={outcome.error} />
        ) : null}
      </Card>

      {!outcome.error && outcome.result ? (
        <Card title="计算结果">
          <Space size="large" wrap align="start" className={styles.statsRow}>
            <Statistic
              title="PPI（像素 / 英寸）"
              value={outcome.result.ppi}
              precision={2}
              valueStyle={{ color: '#1677ff' }}
            />
            <Statistic title="PPCM（像素 / 厘米）" value={outcome.result.ppcm} precision={2} />
            <Statistic title="像素点距" value={outcome.result.pitchMm} precision={3} suffix="mm" />
            <Statistic title="对角线像素" value={outcome.result.diagonalPixels} precision={0} />
          </Space>
          <Descriptions
            column={{ xs: 1, sm: 2 }}
            size="small"
            bordered
            style={{ marginTop: 16 }}
            items={[
              {
                key: 'ratio',
                label: '宽高比',
                children: outcome.ratioLabel ? (
                  <Tag color="blue">{outcome.ratioLabel}</Tag>
                ) : (
                  <span className={styles.mono}>{outcome.result.aspectRatio.toFixed(4)}</span>
                ),
              },
              {
                key: 'tier',
                label: '密度档位',
                children: densityTier(outcome.result.ppi),
              },
              {
                key: 'size',
                label: '物理尺寸（宽 × 高）',
                children: (
                  <span className={styles.mono}>
                    {formatMm(outcome.result.widthMm)} × {formatMm(outcome.result.heightMm)}
                  </span>
                ),
              },
              {
                key: 'diagonal',
                label: '物理对角线',
                children: (
                  <span className={styles.mono}>
                    {formatMm(outcome.result.diagonalMm)}（{diagonalInch.toFixed(2)} 英寸）
                  </span>
                ),
              },
              {
                key: 'area',
                label: '屏幕面积',
                children: (
                  <span className={styles.mono}>
                    {(outcome.result.areaMm2 / 1_000_000).toFixed(4)} m²
                  </span>
                ),
              },
              {
                key: 'total',
                label: '总像素数',
                children: (
                  <span className={styles.mono}>
                    {outcome.result.totalPixels.toLocaleString('en-US')}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      ) : null}

      <Card title="常见设备 PPI 参考">
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          dataSource={DEVICE_REFERENCES}
          columns={[
            { title: '设备', dataIndex: 'name', key: 'name' },
            {
              title: '典型 PPI',
              dataIndex: 'ppi',
              key: 'ppi',
              width: 120,
              render: (value: number) => <span className={styles.mono}>{value}</span>,
            },
            { title: '说明', dataIndex: 'tier', key: 'tier' },
          ]}
        />
        <p className={styles.hint} style={{ margin: '12px 0 0' }}>
          手机厂商公布的分辨率通常为物理像素；部分笔记本默认开启 HiDPI 缩放，逻辑分辨率与物理分辨率不同，
          计算 PPI 时请使用物理像素。
        </p>
      </Card>
    </div>
  );
};

export default PpiCalculator;
