'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { decodePolyline, encodePolyline, parsePointsText, type LatLng } from './utils/polyline';
import { DEFAULT_POINTS, DEFAULT_POLYLINE, PolylineModeEnum, PRECISION_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * Google Encoded Polyline Algorithm Format 折线编解码器：
 * 在「纬度,经度」坐标列表与压缩 ASCII 折线字符串之间双向转换，
 * 支持精度 5（经典 Directions API）与精度 6（2019 年后官方推荐）。
 * 全部解析在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Polyline 编解码交互界面
 */
const PolylineCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<PolylineModeEnum>(PolylineModeEnum.DECODE);
  const [precision, setPrecision] = React.useState<5 | 6>(5);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_POLYLINE);

  const result = React.useMemo<{ output: string; error: string | null; points?: LatLng[] }>(() => {
    if (!input.trim()) {
      return { output: '', error: null };
    }
    if (mode === PolylineModeEnum.DECODE) {
      const decoded = decodePolyline(input, precision);
      if (decoded.error !== null) {
        return { output: '', error: decoded.error };
      }
      const table = decoded.points
        .map((point, index) => `${index + 1},${point.lat},${point.lng}`)
        .join('\n');
      return { output: `序号,纬度,经度\n${table}`, error: null, points: decoded.points };
    }
    const parsed = parsePointsText(input);
    if (parsed.error !== null) {
      return { output: '', error: parsed.error };
    }
    const encoded = encodePolyline(parsed.points, precision);
    return { output: encoded.output, error: encoded.error };
  }, [mode, input, precision]);

  /**
   * 切换转换方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: PolylineModeEnum): void => {
    setMode(next);
    setInput(next === PolylineModeEnum.DECODE ? DEFAULT_POLYLINE : DEFAULT_POINTS);
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async (): Promise<void> => {
    if (!result.output) {
      return;
    }
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  const isDecode = mode === PolylineModeEnum.DECODE;
  const pointCount = result.points?.length ?? 0;

  const columns = [
    { title: '#', dataIndex: 'index', width: 60 },
    { title: '纬度 lat', dataIndex: 'lat' },
    { title: '经度 lng', dataIndex: 'lng' },
  ];
  const tableData = React.useMemo(
    () => (result.points ?? []).map((point, index) => ({ ...point, index: index + 1, key: index })),
    [result.points],
  );

  return (
    <div className={styles.container}>
      <Card title="Encoded Polyline 折线编解码器（Google Maps API 压缩坐标格式）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as PolylineModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '折线 → 坐标（解码）', value: PolylineModeEnum.DECODE },
              { label: '坐标 → 折线（编码）', value: PolylineModeEnum.ENCODE },
            ]}
          />
          <Radio.Group
            value={precision}
            onChange={(event) => setPrecision(event.target.value as 5 | 6)}
            options={PRECISION_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />
        </div>
        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isDecode ? DEFAULT_POLYLINE : DEFAULT_POINTS)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.label} style={{ marginTop: 12 }}>
          {isDecode ? 'Polyline 字符串输入：' : '坐标点输入（每行「纬度,经度」）：'}
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            isDecode
              ? '粘贴折线字符串，如 _p~iF~ps|U_ulLnnqC_mqNvxq`@'
              : '每行一个坐标点，纬度在前经度在后，如 38.5,-120.2'
          }
          autoSize={{ minRows: 5, maxRows: 14 }}
          spellCheck={false}
          style={{ marginTop: 8, fontFamily: isDecode ? 'monospace' : undefined }}
        />
      </Card>

      <Card
        title={
          <Space>
            <span>{isDecode ? '坐标点结果' : 'Polyline 字符串结果'}</span>
            {isDecode && !result.error && pointCount > 0 ? (
              <Tag color="blue">{pointCount} 个坐标点</Tag>
            ) : null}
          </Space>
        }
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={Boolean(result.error) || !result.output}
          >
            复制结果
          </Button>
        }
      >
        {result.error ? (
          <Alert
            type="error"
            showIcon
            message={isDecode ? '折线解码失败' : '坐标编码失败'}
            description={result.error}
          />
        ) : isDecode ? (
          pointCount > 0 ? (
            <Table
              size="small"
              columns={columns}
              dataSource={tableData}
              pagination={pointCount > 50 ? { pageSize: 50, showSizeChanger: false } : false}
            />
          ) : (
            <span className={styles.empty}>输入折线字符串后在此展示坐标点</span>
          )
        ) : (
          <Input.TextArea value={result.output} readOnly autoSize={{ minRows: 3, maxRows: 10 }} />
        )}
        <div className={styles.hint}>
          算法对相邻坐标的差值做 zigzag + Base64 式 5 位分块压缩；精度 5 与精度 6 的字符串互不兼容，
          解码结果越界通常是精度选错。全部运算仅在浏览器本地完成。
        </div>
      </Card>
    </div>
  );
};

export default PolylineCodec;
