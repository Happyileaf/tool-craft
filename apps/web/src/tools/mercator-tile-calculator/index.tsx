'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, InputNumber, Slider, Space, Table, Tag, message } from 'antd';
import {
  lngLatToTile,
  tileToBounds,
  parentTile,
  childTiles,
  tileToQuadKey,
  xyzToTms,
  osmTileUrl,
  formatTilePath,
  MAX_ZOOM,
  type PointTileResult,
  type TileBounds,
  type TileCoord,
} from './utils/mercator';
import { GEO_PRESETS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

function fmt(value: number, digits = 6): string {
  return String(parseFloat(value.toFixed(digits)));
}

/** 在 n×n 全球网格中高亮当前瓦片的极简 SVG 示意图（z≤6 时可读） */
function TileGridSvg({ coord }: { coord: TileCoord }) {
  const n = 2 ** coord.z;
  const cell = n <= 1 ? 0 : 160 / n;
  return (
    <svg width="100%" viewBox="0 0 160 160" role="img" aria-label="瓦片在全球网格中的位置">
      <rect x={0} y={0} width={160} height={160} fill="#f5f5f5" stroke="rgba(0,0,0,0.15)" />
      {n > 1
        ? Array.from({ length: n - 1 }).map((_, i) => (
            <g key={i}>
              <line x1={cell * (i + 1)} y1={0} x2={cell * (i + 1)} y2={160} stroke="rgba(0,0,0,0.1)" />
              <line x1={0} y1={cell * (i + 1)} x2={160} y2={cell * (i + 1)} stroke="rgba(0,0,0,0.1)" />
            </g>
          ))
        : null}
      <rect
        x={coord.x * cell}
        y={coord.y * cell}
        width={Math.max(cell, 1)}
        height={Math.max(cell, 1)}
        fill="rgba(22,119,255,0.45)"
        stroke="#1677ff"
      />
    </svg>
  );
}

const MercatorTileCalculator: React.FC<ToolComponentProps> = () => {
  const [lng, setLng] = React.useState<number | null>(116.397);
  const [lat, setLat] = React.useState<number | null>(39.908);
  const [z, setZ] = React.useState<number>(12);

  const [tz, setTz] = React.useState<number | null>(12);
  const [tx, setTx] = React.useState<number | null>(3372);
  const [ty, setTy] = React.useState<number | null>(1552);

  const forward = React.useMemo<{ value?: PointTileResult; error?: string }>(() => {
    if (lng === null || lat === null) return {};
    try {
      return { value: lngLatToTile(Number(lng), Number(lat), z) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [lng, lat, z]);

  const inverse = React.useMemo<{ bounds?: TileBounds; error?: string }>(() => {
    if (tz === null || tx === null || ty === null) return {};
    try {
      return { bounds: tileToBounds({ z: Number(tz), x: Number(tx), y: Number(ty) }) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [tz, tx, ty]);

  const inverseCoord: TileCoord | null =
    tz !== null && tx !== null && ty !== null ? { z: Number(tz), x: Number(tx), y: Number(ty) } : null;
  const parent = inverseCoord && inverse.bounds ? parentTile(inverseCoord) : null;
  const children = inverseCoord && inverse.bounds ? childTiles(inverseCoord) : [];
  const quadKey = inverseCoord && inverse.bounds ? tileToQuadKey(inverseCoord) : '';
  const tmsY = inverseCoord && inverse.bounds ? xyzToTms(inverseCoord) : null;

  const forwardCoord: TileCoord | null = forward.value
    ? { z: forward.value.z, x: forward.value.tileX, y: forward.value.tileY }
    : null;

  const copyForward = () => {
    if (!forward.value || !forwardCoord) return;
    const v = forward.value;
    copyToClipboard(
      [
        `${lng},${lat} @${z}`,
        `XYZ: ${formatTilePath(forwardCoord)}`,
        `tile px: (${v.innerPixelX}, ${v.innerPixelY})`,
      ].join('\n'),
    );
    message.success('结果已复制');
  };

  return (
    <div className={styles.container}>
      <Card
        title="经纬度 → XYZ 瓦片 / 像素"
        extra={
          <Button size="small" onClick={copyForward}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          Web Mercator（EPSG:3857）Slippy Map：n=2^z，X=(lng+180)/360·n，Y=(1−asinh(tan φ)/π)/2·n；
          瓦片 256px，原点在左上（OSM/Google XYZ）。
        </p>
        <Space wrap size="middle">
          <span className={styles.field}>
            <span className={styles.fieldLabel}>经度 lng</span>
            <InputNumber value={lng} onChange={(value) => setLng(value === null ? null : Number(value))} step={0.001} />
          </span>
          <span className={styles.field}>
            <span className={styles.fieldLabel}>纬度 lat</span>
            <InputNumber value={lat} onChange={(value) => setLat(value === null ? null : Number(value))} step={0.001} />
          </span>
          <span className={styles.field} style={{ minWidth: 220 }}>
            <span className={styles.fieldLabel}>缩放 z = {z}</span>
            <Slider min={0} max={MAX_ZOOM} value={z} onChange={setZ} />
          </span>
        </Space>
        <Space wrap style={{ marginTop: 12 }}>
          {GEO_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              size="small"
              onClick={() => {
                setLng(preset.lng);
                setLat(preset.lat);
                setZ(preset.z);
              }}
            >
              {preset.name}
            </Button>
          ))}
        </Space>

        {forward.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法计算" description={forward.error} />
        ) : forward.value && forwardCoord ? (
          <Descriptions style={{ marginTop: 16 }} bordered size="small" column={2}>
            <Descriptions.Item label="瓦片 XYZ">
              <Tag className={styles.mono} color="blue">
                {formatTilePath(forwardCoord)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="TMS y">{forward.value.tmsY}</Descriptions.Item>
            <Descriptions.Item label="瓦片内像素">
              <span className={styles.mono}>
                ({forward.value.innerPixelX}, {forward.value.innerPixelY})
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="全局像素（256·2^z 画布）">
              <span className={styles.mono}>
                ({forward.value.pixelX}, {forward.value.pixelY})
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="QuadKey" span={2}>
              <span className={styles.mono}>{tileToQuadKey(forwardCoord) || '（空串，z=0）'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="OSM 切片 URL" span={2}>
              <a href={osmTileUrl(forwardCoord)} target="_blank" rel="noreferrer" className={styles.mono}>
                {osmTileUrl(forwardCoord)}
              </a>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Card title="XYZ 瓦片 → 四至包围盒 / 父子层级">
        <Space wrap size="middle">
          <span className={styles.field}>
            <span className={styles.fieldLabel}>z</span>
            <InputNumber min={0} max={MAX_ZOOM} value={tz} onChange={(value) => setTz(value)} style={{ width: 80 }} />
          </span>
          <span className={styles.field}>
            <span className={styles.fieldLabel}>x</span>
            <InputNumber value={tx} onChange={(value) => setTx(value)} style={{ width: 100 }} />
          </span>
          <span className={styles.field}>
            <span className={styles.fieldLabel}>y（XYZ）</span>
            <InputNumber value={ty} onChange={(value) => setTy(value)} style={{ width: 100 }} />
          </span>
        </Space>

        {inverse.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法计算" description={inverse.error} />
        ) : inverse.bounds && inverseCoord ? (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="北 N / 南 S">
                <span className={styles.mono}>
                  {fmt(inverse.bounds.north)} / {fmt(inverse.bounds.south)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="西 W / 东 E">
                <span className={styles.mono}>
                  {fmt(inverse.bounds.west)} / {fmt(inverse.bounds.east)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="中心点">
                <span className={styles.mono}>
                  {fmt(inverse.bounds.center.lng)}, {fmt(inverse.bounds.center.lat)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="TMS y / QuadKey">
                <span className={styles.mono}>
                  {tmsY} / {quadKey || '（空）'}
                </span>
              </Descriptions.Item>
            </Descriptions>
            <Space wrap style={{ marginTop: 12 }}>
              <span className={styles.hint}>父瓦片：</span>
              {parent ? <Tag>{formatTilePath(parent)}</Tag> : <Tag>无（z=0）</Tag>}
            </Space>
            <Table
              style={{ marginTop: 12 }}
              size="small"
              pagination={false}
              rowKey={(row) => formatTilePath(row)}
              dataSource={children}
              columns={[
                {
                  title: '四个子瓦片（z+1）',
                  dataIndex: 'path',
                  key: 'path',
                  render: (_: unknown, row: TileCoord) => (
                    <Button
                      type="link"
                      size="small"
                      className={styles.mono}
                      onClick={() => {
                        setTz(row.z);
                        setTx(row.x);
                        setTy(row.y);
                      }}
                    >
                      {formatTilePath(row)}
                    </Button>
                  ),
                },
                { title: 'QuadKey', key: 'qk', render: (_: unknown, row: TileCoord) => tileToQuadKey(row) },
              ]}
            />
            {inverseCoord.z <= 6 ? (
              <div style={{ marginTop: 12, maxWidth: 220 }}>
                <TileGridSvg coord={inverseCoord} />
                <p className={styles.hint}>蓝色为当前瓦片在全球网格中的位置</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default MercatorTileCalculator;
