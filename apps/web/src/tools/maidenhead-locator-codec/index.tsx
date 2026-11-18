'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, InputNumber, Radio, Space, Tabs, Tag, message } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { decodeMaidenhead, encodeMaidenhead } from './utils/maidenhead';
import styles from './index.module.css';

const PAIR_OPTIONS = [
  { label: '4 字符（Field，约 2000 km）', value: 2 },
  { label: '6 字符（Square，约 110 km）', value: 3 },
  { label: '8 字符（Subsquare，约 5 km）', value: 4 },
  { label: '10 字符（扩展，约 200 m）', value: 5 },
];

const formatDegree = (value: number, suffix: string): string =>
  `${value.toFixed(5)}° ${suffix}`;

/** 编码面板：经纬度 → 网格 */
const EncodePanel: React.FC = () => {
  const [lat, setLat] = React.useState(39.9042);
  const [lon, setLon] = React.useState(116.4074);
  const [pairs, setPairs] = React.useState(3);

  const output = React.useMemo(() => {
    try {
      const locator = encodeMaidenhead(lat, lon, pairs);
      const bounds = decodeMaidenhead(locator);
      return { locator, bounds, error: '' };
    } catch (error) {
      return { locator: '', bounds: null, error: (error as Error).message };
    }
  }, [lat, lon, pairs]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <span>纬度（-90 ~ 90）：</span>
        <InputNumber value={lat} onChange={(value) => setLat(value ?? 0)} step={0.0001} style={{ width: 160 }} />
        <span>经度（-180 ~ 180）：</span>
        <InputNumber value={lon} onChange={(value) => setLon(value ?? 0)} step={0.0001} style={{ width: 160 }} />
      </Space>
      <Radio.Group options={PAIR_OPTIONS} value={pairs} onChange={(event) => setPairs(event.target.value)} optionType="button" buttonStyle="solid" />
      {output.error ? (
        <Alert type="error" showIcon message={output.error} />
      ) : (
        <>
          <Alert type="success" showIcon message={`Maidenhead 网格：${output.locator}`} />
          {output.bounds && (
            <Descriptions bordered size="small" column={1} title="网格地理范围">
              <Descriptions.Item label="西南角">{formatDegree(output.bounds.south, 'S')} / {formatDegree(output.bounds.west, 'W')}</Descriptions.Item>
              <Descriptions.Item label="东北角">{formatDegree(output.bounds.north, 'N')} / {formatDegree(output.bounds.east, 'E')}</Descriptions.Item>
              <Descriptions.Item label="中心坐标">{formatDegree(output.bounds.centerLat, 'N/S')} / {formatDegree(output.bounds.centerLon, 'E/W')}</Descriptions.Item>
            </Descriptions>
          )}
        </>
      )}
    </Space>
  );
};

/** 解码面板：网格 → 坐标 */
const DecodePanel: React.FC = () => {
  const [locator, setLocator] = React.useState('OM89EV');

  const output = React.useMemo(() => {
    try {
      return { bounds: decodeMaidenhead(locator), error: '' };
    } catch (error) {
      return { bounds: null, error: (error as Error).message };
    }
  }, [locator]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space style={{ width: '100%' }}>
        <Input
          value={locator}
          onChange={(event) => setLocator(event.target.value)}
          placeholder="输入网格，如 JN58TD（大小写不敏感）"
          style={{ width: 280, textTransform: 'uppercase' }}
          allowClear
        />
        <Button icon={<ClearOutlined />} onClick={() => setLocator('')}>
          清空
        </Button>
      </Space>
      {output.error ? (
        <Alert type="error" showIcon message={output.error} />
      ) : (
        output.bounds && (
          <>
            <Alert type="success" showIcon message={`规范形式：${output.bounds.locator}（${output.bounds.pairs} 对字段）`} />
            <Descriptions bordered size="small" column={1} title="解码结果">
              <Descriptions.Item label="中心纬度">{output.bounds.centerLat.toFixed(6)}°</Descriptions.Item>
              <Descriptions.Item label="中心经度">{output.bounds.centerLon.toFixed(6)}°</Descriptions.Item>
              <Descriptions.Item label="纬度范围">{output.bounds.south.toFixed(6)}° ~ {output.bounds.north.toFixed(6)}°（跨度 {(output.bounds.north - output.bounds.south).toFixed(5)}°）</Descriptions.Item>
              <Descriptions.Item label="经度范围">{output.bounds.west.toFixed(6)}° ~ {output.bounds.east.toFixed(6)}°（跨度 {(output.bounds.east - output.bounds.west).toFixed(5)}°）</Descriptions.Item>
            </Descriptions>
          </>
        )
      )}
    </Space>
  );
};

/**
 * Maidenhead 网格定位编解码器：WGS-84 经纬度与 QTH Locator 互转，
 * 支持 4–10 字符精度，全部为本地纯函数计算。
 *
 * @param _props - 工具组件属性
 * @returns 工具交互界面
 */
const MaidenheadLocatorCodec: React.FC<ToolComponentProps> = (_props) => {
  React.useEffect(() => {
    message.info('Maidenhead（QTH Locator）常用于业余无线电 VHF/UHF 通联定位');
  }, []);

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">ARRL Maidenhead Locator System：字母对（A–R/A–X）与数字对（0–9）交替编码，纯本地计算</Tag>
          <Tabs
            items={[
              { key: 'encode', label: '坐标 → 网格', children: <EncodePanel /> },
              { key: 'decode', label: '网格 → 坐标', children: <DecodePanel /> },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

export default MaidenheadLocatorCodec;
