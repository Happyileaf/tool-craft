'use client';

import { useState } from 'react';
import { Alert, Button, Radio, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  measurePolygon,
  parseCoordinateText,
  parseGeoJson,
  type PolygonMeasurement,
  type RingMeasurement,
} from './utils/polygon';
import { POLYGON_TOOL_I18N as T } from './constants';
import styles from './index.module.css';

const { Title, Paragraph, Text } = Typography;

type InputMode = 'manual' | 'geojson';

const MANUAL_SAMPLE = '0, 0\n4, 0\n4, 4\n0, 4';
const GEOJSON_SAMPLE = `{
  "type": "Polygon",
  "coordinates": [
    [[0,0],[4,0],[4,4],[0,4],[0,0]],
    [[1,1],[3,1],[3,3],[1,3],[1,1]]
  ]
}`;

export default function PolygonAreaCalculator() {
  const [mode, setMode] = useState<InputMode>('manual');
  const [input, setInput] = useState<string>('');
  const [measurement, setMeasurement] = useState<PolygonMeasurement | null>(null);
  const [hasIntersection, setHasIntersection] = useState<boolean>(false);

  const columns: ColumnsType<RingMeasurement> = [
    {
      title: T.ringIndex,
      dataIndex: 'index',
      key: 'index',
      width: 110,
      render: (index: number) => (
        <Tag color={index === 0 ? 'blue' : 'orange'}>
          {index === 0 ? T.outerRing : `${T.holeRing} ${index}`}
        </Tag>
      ),
    },
    { title: T.vertexCount, dataIndex: 'vertexCount', key: 'vertexCount', width: 90 },
    {
      title: T.area,
      dataIndex: 'area',
      key: 'area',
      width: 140,
      render: (value: number) => <Text className={styles.mono}>{value}</Text>,
    },
    {
      title: T.signedArea,
      dataIndex: 'signedArea',
      key: 'signedArea',
      width: 130,
      render: (value: number) => <Text className={styles.mono}>{value}</Text>,
    },
    {
      title: T.perimeter,
      dataIndex: 'perimeter',
      key: 'perimeter',
      width: 130,
      render: (value: number) => <Text className={styles.mono}>{value}</Text>,
    },
    {
      title: T.orientation,
      dataIndex: 'orientation',
      key: 'orientation',
      width: 130,
      render: (orientation: 'ccw' | 'cw') => (
        <Tag color={orientation === 'ccw' ? 'green' : 'geekblue'}>
          {orientation === 'ccw' ? T.ccw : T.cw}
        </Tag>
      ),
    },
    {
      title: T.selfIntersect,
      dataIndex: 'selfIntersecting',
      key: 'selfIntersecting',
      render: (value: boolean) => (value ? <Tag color="error">{T.selfIntersect}</Tag> : '—'),
    },
  ];

  const handleCalculate = () => {
    if (!input.trim()) {
      message.warning('请先输入坐标或 GeoJSON');
      return;
    }
    try {
      let result: PolygonMeasurement;
      if (mode === 'manual') {
        const ring = parseCoordinateText(input);
        result = measurePolygon([ring]);
      } else {
        const polygons = parseGeoJson(input);
        // MultiPolygon 时合并各多边形的环逐环展示，净面积按各多边形求和
        const first = measurePolygon(polygons[0]!);
        if (polygons.length === 1) {
          result = first;
        } else {
          const rest = polygons.slice(1).map((rings) => measurePolygon(rings));
          result = {
            rings: [first, ...rest].flatMap((item) => item.rings),
            netArea: [first, ...rest].reduce((sum, item) => sum + item.netArea, 0),
            outerPerimeter: [first, ...rest].reduce((sum, item) => sum + item.outerPerimeter, 0),
            totalVertices: [first, ...rest].reduce((sum, item) => sum + item.totalVertices, 0),
          };
          // 重新编号环 index，避免多个多边形都从 0 开始
          result.rings = result.rings.map((ring, index) => ({ ...ring, index }));
        }
      }
      setMeasurement(result);
      setHasIntersection(result.rings.some((ring) => ring.selfIntersecting));
    } catch (error) {
      setMeasurement(null);
      message.error(`${T.errorPrefix}：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          {T.title}
        </Title>
        <Paragraph className={styles.subtitle}>{T.subtitle}</Paragraph>
      </div>

      <div className={styles.panel}>
        <div>
          <div className={styles.fieldLabel}>{T.modeLabel}</div>
          <Radio.Group
            style={{ marginTop: 8 }}
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as InputMode);
              setMeasurement(null);
            }}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="manual">{T.modeManual}</Radio.Button>
            <Radio.Button value="geojson">{T.modeGeoJson}</Radio.Button>
          </Radio.Group>
        </div>

        <div>
          <div className={styles.fieldLabel}>
            {mode === 'manual' ? T.manualLabel : T.geojsonLabel}
          </div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === 'manual' ? T.manualPlaceholder : T.geojsonPlaceholder}
            rows={mode === 'manual' ? 7 : 10}
          />
        </div>

        <Space className={styles.actions}>
          <Button type="primary" onClick={handleCalculate}>
            {T.calculate}
          </Button>
          <Button
            onClick={() => {
              setInput(mode === 'manual' ? MANUAL_SAMPLE : GEOJSON_SAMPLE);
              setMeasurement(null);
            }}
          >
            {T.sample}
          </Button>
          <Button
            danger
            onClick={() => {
              setInput('');
              setMeasurement(null);
            }}
          >
            {T.clear}
          </Button>
        </Space>
      </div>

      {hasIntersection && (
        <Alert type="warning" showIcon message={T.selfIntersectHint} />
      )}

      {measurement ? (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.netArea}</span>
              <span className={styles.summaryValue}>{measurement.netArea}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.outerPerimeter}</span>
              <span className={styles.summaryValue}>{measurement.outerPerimeter}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.totalVertices}</span>
              <span className={styles.summaryValue}>{measurement.totalVertices}</span>
            </div>
          </div>
          <div>
            <div className={styles.resultTitle} style={{ marginBottom: 10 }}>
              {T.resultTitle}
            </div>
            <Table<RingMeasurement>
              rowKey={(record) => `ring-${record.index}`}
              columns={columns}
              dataSource={measurement.rings}
              pagination={false}
              size="middle"
              scroll={{ x: 820 }}
            />
          </div>
        </>
      ) : (
        <div className={styles.empty}>{T.emptyHint}</div>
      )}
    </div>
  );
}
