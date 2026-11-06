'use client';

import React from 'react';
import { Alert, Card, Descriptions, Input, Radio, Space, Table, Tag } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_COORDINATE_INPUT,
  DEFAULT_GEOJSON_INPUT,
  DIRECTION_LABELS,
  MODE_OPTIONS,
  RESULT_PRECISION,
} from './constants';
import {
  PolygonError,
  dedupeVertices,
  measureGeoJsonCollection,
  measureRing,
  parseCoordinateText,
  parseGeoJson,
  type InputMode,
  type Point,
  type PolygonMetrics,
} from './utils/polygon';
import styles from './index.module.css';

/**
 * 坐标模式计算结果
 */
type CoordinateResult =
  | {
      error: null;
      vertexCount: number;
      removed: number;
      signedArea: number;
      area: number;
      perimeter: number;
      centroid: Point;
      direction: keyof typeof DIRECTION_LABELS;
      vertices: Point[];
    }
  | { error: string };

/**
 * GeoJSON 模式计算结果
 */
type GeoJsonResult =
  | {
      error: null;
      polygonCount: number;
      metrics: PolygonMetrics[];
      totalNetArea: number;
      totalPerimeter: number;
    }
  | { error: string };

/**
 * 按统一精度格式化数值，消除 −0 与浮点噪声。
 *
 * @param value - 原始数值
 * @returns 格式化后的数字
 */
function round(value: number): number {
  const rounded = Number(value.toFixed(RESULT_PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * 多边形面积与周长计算器：支持坐标文本与 GeoJSON Polygon / MultiPolygon，
 * 基于鞋带公式计算有向 / 绝对面积、周长、质心与环绕方向，全部本地运算。
 *
 * @param props - 工具组件属性
 * @returns 多边形度量交互界面
 */
const PolygonAreaPerimeterCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<InputMode>('coordinates');
  const [coordinateText, setCoordinateText] = React.useState<string>(DEFAULT_COORDINATE_INPUT);
  const [geoJsonText, setGeoJsonText] = React.useState<string>(DEFAULT_GEOJSON_INPUT);

  const coordinateResult = React.useMemo<CoordinateResult>(() => {
    if (!coordinateText.trim()) {
      return { error: '请输入至少 3 个顶点坐标（每行 x, y）' };
    }
    try {
      const rawPoints = parseCoordinateText(coordinateText);
      const { vertices, removed } = dedupeVertices(rawPoints);
      const metrics = measureRing(vertices);
      return {
        error: null,
        vertexCount: metrics.vertexCount,
        removed,
        signedArea: round(metrics.signedArea),
        area: round(metrics.area),
        perimeter: round(metrics.perimeter),
        centroid: { x: round(metrics.centroid.x), y: round(metrics.centroid.y) },
        direction: metrics.direction,
        vertices,
      };
    } catch (error) {
      return {
        error: error instanceof PolygonError ? error.message : '计算失败，请检查输入',
      };
    }
  }, [coordinateText]);

  const geoJsonResult = React.useMemo<GeoJsonResult>(() => {
    if (!geoJsonText.trim()) {
      return { error: '请粘贴 GeoJSON Polygon 或 MultiPolygon' };
    }
    try {
      const items = parseGeoJson(geoJsonText);
      const { metrics, totalNetArea, totalPerimeter } = measureGeoJsonCollection(items);
      return {
        error: null,
        polygonCount: metrics.length,
        metrics,
        totalNetArea: round(totalNetArea),
        totalPerimeter: round(totalPerimeter),
      };
    } catch (error) {
      return {
        error: error instanceof PolygonError ? error.message : '解析失败，请检查 GeoJSON',
      };
    }
  }, [geoJsonText]);

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="多边形面积与周长计算器（鞋带公式 · GeoJSON 带孔）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as InputMode)}
            options={MODE_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
          />

          {mode === 'coordinates' ? (
            <>
              <Input.TextArea
                value={coordinateText}
                onChange={(event) => setCoordinateText(event.target.value)}
                autoSize={{ minRows: 6, maxRows: 16 }}
                spellCheck={false}
                className={styles.textarea}
                placeholder="每行一个顶点：x, y（支持逗号 / 空格 / 制表符分隔）"
              />

              {coordinateResult.error !== null ? (
                <Alert type="error" showIcon message={coordinateResult.error} />
              ) : (
                <>
                  {coordinateResult.removed > 0 && (
                    <Alert
                      type="info"
                      showIcon
                      message={`已自动去除 ${coordinateResult.removed} 个相邻重复点 / 显式闭合点，计算时自动补闭合边且不重复计边`}
                    />
                  )}
                  <Descriptions bordered column={2} size="small" title="度量结果（平面笛卡尔坐标）">
                    <Descriptions.Item label="顶点数（边数）">
                      {coordinateResult.vertexCount}
                    </Descriptions.Item>
                    <Descriptions.Item label="环绕方向">
                      <Tag color={DIRECTION_LABELS[coordinateResult.direction].color}>
                        {DIRECTION_LABELS[coordinateResult.direction].label}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="有向面积（鞋带公式）">
                      <span className={styles.formula}>{coordinateResult.signedArea}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="绝对面积">
                      <span className={styles.formula}>{coordinateResult.area}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="周长">
                      <span className={styles.formula}>{coordinateResult.perimeter}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="质心（顶点算术平均）">
                      <span className={styles.formula}>
                        ({coordinateResult.centroid.x}, {coordinateResult.centroid.y})
                      </span>
                    </Descriptions.Item>
                  </Descriptions>

                  <Table
                    size="small"
                    rowKey={(_, index) => String(index)}
                    pagination={false}
                    dataSource={coordinateResult.vertices}
                    columns={[
                      { title: '#', render: (_, __, index) => index + 1, width: 60 },
                      {
                        title: 'x',
                        dataIndex: 'x',
                        render: (value: number) => round(value),
                      },
                      {
                        title: 'y',
                        dataIndex: 'y',
                        render: (value: number) => round(value),
                      },
                    ]}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <Input.TextArea
                value={geoJsonText}
                onChange={(event) => setGeoJsonText(event.target.value)}
                autoSize={{ minRows: 8, maxRows: 20 }}
                spellCheck={false}
                className={styles.textarea}
                placeholder='粘贴 {"type":"Polygon","coordinates":[[[x,y],...]]} 或 MultiPolygon'
              />

              {geoJsonResult.error !== null ? (
                <Alert type="error" showIcon message={geoJsonResult.error} />
              ) : (
                <>
                  <Alert
                    type="success"
                    showIcon
                    message={
                      <Space size="large" wrap>
                        <span>多边形数量：{geoJsonResult.polygonCount}</span>
                        <span>
                          净面积合计（外环 − 孔）：
                          <strong>{geoJsonResult.totalNetArea}</strong>
                        </span>
                        <span>
                          外环周长合计：<strong>{geoJsonResult.totalPerimeter}</strong>
                        </span>
                      </Space>
                    }
                  />
                  {geoJsonResult.metrics.map((item, index) => (
                    <Descriptions
                      key={index}
                      bordered
                      column={2}
                      size="small"
                      title={`多边形 ${index + 1}${item.holeCount > 0 ? `（含 ${item.holeCount} 个孔）` : ''}`}
                    >
                      <Descriptions.Item label="顶点数">{item.vertexCount}</Descriptions.Item>
                      <Descriptions.Item label="环绕方向">
                        <Tag color={DIRECTION_LABELS[item.direction].color}>
                          {DIRECTION_LABELS[item.direction].label}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="外环面积">{round(item.area)}</Descriptions.Item>
                      <Descriptions.Item label="净面积（减孔后）">
                        <strong>{round(item.netArea)}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="外环周长">{round(item.perimeter)}</Descriptions.Item>
                      <Descriptions.Item label="质心（顶点算术平均）">
                        <span className={styles.formula}>
                          ({round(item.centroid.x)}, {round(item.centroid.y)})
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  ))}
                </>
              )}
            </>
          )}

          <div className={styles.hint}>
            面积由鞋带（Shoelace）公式计算，复杂度 O(n)；首末点不同会自动闭合，重复相邻点与显式闭合点自动去重。
            有向面积为正表示逆时针（CCW）、为负表示顺时针（CW），该判定基于数学坐标系（y 轴向上）；
            屏幕坐标（y 轴向下）下符号相反。质心为顶点算术平均，并非面积加权形心。
            GeoJSON 经纬度输入按平面笛卡尔坐标做近似计算，未做球面 / 投影修正，跨大范围的面积仅作参考。
            所有运算均在浏览器本地完成。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default PolygonAreaPerimeterCalculator;
