'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  convertCoordinate,
  parseBatchLines,
  parseCoordinate,
  type Axis,
  type BatchLine,
  type CoordFormat,
} from './utils/coordinate';
import {
  DEFAULT_BATCH,
  DEFAULT_LAT,
  DEFAULT_LON,
  FORMAT_OPTIONS,
  MODE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface AxisBlockProps {
  title: string;
  value: string;
  axis: Axis;
  target: CoordFormat;
  onChange: (value: string) => void;
}

const FORMAT_LABEL: Record<CoordFormat, string> = {
  dd: 'DD 十进制度',
  ddm: 'DDM 度分',
  dms: 'DMS 度分秒',
};

const AxisBlock: React.FC<AxisBlockProps> = ({ title, value, axis, target, onChange }) => {
  const parsed = parseCoordinate(value, axis);

  const copy = (text: string, label: string) => {
    copyToClipboard(text);
    message.success(`已复制${title}${label}`);
  };

  return (
    <div className={styles.axisBlock}>
      <div className={styles.axisHeader}>
        <span className={styles.axisTitle}>{title}</span>
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          spellCheck={false}
          className={styles.mono}
          placeholder={axis === 'lat' ? '如 31.2304 或 31°13′49.44″N' : '如 121.4737 或 121°28′2.4″E'}
        />
      </div>
      {'error' in parsed ? (
        <Alert type="error" showIcon message={parsed.error} className={styles.alert} />
      ) : (
        <div className={styles.formatRows}>
          {FORMAT_OPTIONS.map((option) => {
            const result = convertCoordinate(value, axis, option.value as CoordFormat);
            const active = option.value === target;
            return (
              <div
                key={option.value}
                className={active ? styles.formatRowActive : styles.formatRow}
              >
                <span className={styles.formatLabel}>{option.label}</span>
                <span className={styles.mono}>
                  {'text' in result ? result.text : ''}
                </span>
                <Button
                  size="small"
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => copy('text' in result ? result.text : '', FORMAT_LABEL[option.value as CoordFormat])}
                >
                  复制
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const GeoCoordinateConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<'single' | 'batch'>('single');
  const [target, setTarget] = React.useState<CoordFormat>('dms');
  const [lat, setLat] = React.useState(DEFAULT_LAT);
  const [lon, setLon] = React.useState(DEFAULT_LON);
  const [batch, setBatch] = React.useState(defaultInput || DEFAULT_BATCH);

  const rows = React.useMemo(() => parseBatchLines(batch), [batch]);
  const successCount = rows.filter((r) => !r.error).length;

  const batchColumns: ColumnsType<BatchLine> = [
    {
      title: '行号',
      dataIndex: 'lineNo',
      width: 72,
      render: (lineNo: number) => <span className={styles.mono}>{lineNo}</span>,
    },
    {
      title: `纬度（${FORMAT_LABEL[target]}）`,
      key: 'lat',
      render: (_, record) => {
        if (record.lat === null) {
          return <Tag color="default">—</Tag>;
        }
        const result = convertCoordinate(record.lat, 'lat', target);
        return <span className={styles.mono}>{'text' in result ? result.text : ''}</span>;
      },
    },
    {
      title: `经度（${FORMAT_LABEL[target]}）`,
      key: 'lon',
      render: (_, record) => {
        if (record.lon === null) {
          return <Tag color="default">—</Tag>;
        }
        const result = convertCoordinate(record.lon, 'lon', target);
        return <span className={styles.mono}>{'text' in result ? result.text : ''}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'error',
      width: 240,
      render: (error: string | null) => {
        if (error === null) {
          return <Tag color="success">正常</Tag>;
        }
        if (error === '空行') {
          return <Tag>空行</Tag>;
        }
        return <Tag color="error">{error}</Tag>;
      },
    },
  ];

  const copyAll = () => {
    const lines = rows
      .filter((r) => r.lat !== null && r.lon !== null)
      .map((r) => {
        const latText = convertCoordinate(r.lat as string, 'lat', target);
        const lonText = convertCoordinate(r.lon as string, 'lon', target);
        return `${'text' in latText ? latText.text : ''}, ${'text' in lonText ? lonText.text : ''}`;
      });
    if (lines.length === 0) {
      message.error('暂无可复制的成功行');
      return;
    }
    copyToClipboard(lines.join('\n'));
    message.success(`已复制 ${lines.length} 行结果`);
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.controls}>
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value as 'single' | 'batch')}
            optionType="button"
            buttonStyle="solid"
            options={MODE_OPTIONS}
          />
          <Radio.Group
            value={target}
            onChange={(e) => setTarget(e.target.value as CoordFormat)}
            optionType="button"
            options={FORMAT_OPTIONS}
          />
        </div>

        {mode === 'single' ? (
          <div className={styles.axisGrid}>
            <AxisBlock title="纬度" value={lat} axis="lat" target={target} onChange={setLat} />
            <AxisBlock title="经度" value={lon} axis="lon" target={target} onChange={setLon} />
          </div>
        ) : (
          <div className={styles.batchArea}>
            <Input.TextArea
              value={batch}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBatch(e.target.value)}
              spellCheck={false}
              autoSize={{ minRows: 5, maxRows: 14 }}
              className={styles.mono}
              placeholder={'每行一个点：纬度, 经度\n31.2304, 121.4737\nN39°54′, 116°24′E'}
            />
            <div className={styles.batchToolbar}>
              <Tag color="success">成功 {successCount} 行</Tag>
              <Tag>{rows.length} 行</Tag>
              <Button size="small" icon={<CopyOutlined />} onClick={copyAll}>
                复制全部成功行（{FORMAT_LABEL[target]}）
              </Button>
            </div>
            <Table<BatchLine>
              columns={batchColumns}
              dataSource={rows}
              rowKey="lineNo"
              size="small"
              pagination={false}
              scroll={{ y: 360 }}
            />
          </div>
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="本工具仅在 DD（十进制度）/ DDM（度分）/ DMS（度分秒）三种表示法之间互转，并校验纬度 -90~90、经度 -180~180 的取值范围，兼容 N/S/E/W 半球字母与正负号两种写法；不涉及 WGS84/GCJ02/BD09 坐标系偏移，也不计算距离与方位角（请使用「大圆距离与方位角计算器」）。全部计算在浏览器本地完成。"
      />
    </div>
  );
};

export default GeoCoordinateConverter;
