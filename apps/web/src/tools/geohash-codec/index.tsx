'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decode, encode, encodeSteps } from './utils/geohash';
import type { EncodeStep } from './utils/geohash';
import {
  ConvertModeEnum,
  DEFAULT_PRECISION,
  DEFAULT_SAMPLE_HASH,
  DEFAULT_SAMPLE_LAT,
  DEFAULT_SAMPLE_LNG,
  MODE_OPTIONS,
  PRECISION_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 紧凑数值格式化：极小数值走科学计数法，其余保留最多 7 位小数并去尾零。
 *
 * @param value - 待格式化数值
 * @returns 紧凑文本
 */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  if (value !== 0 && Math.abs(value) < 0.000001) {
    return value.toExponential(3);
  }
  return value.toFixed(7).replace(/\.?0+$/, '');
}

/**
 * 从 defaultSampleInput 形式的「纬度,经度」文本解析初始坐标。
 *
 * @param text - 示例输入
 * @returns 经纬度元组，解析失败返回 null
 */
function parseSamplePoint(text?: string): { lat: number; lng: number } | null {
  if (!text) {
    return null;
  }
  const parts = text.split(',');
  if (parts.length !== 2) {
    return null;
  }
  const [latText, lngText] = parts;
  const lat = Number((latText ?? '').trim());
  const lng = Number((lngText ?? '').trim());
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

interface StepRow extends EncodeStep {
  key: number;
}

/**
 * Geohash 编解码器，在经纬度坐标与 geohash base32 字符串之间双向转换，
 * 编码侧展示逐字符区间二分过程，解码侧输出中心点、边界框与误差，全部本地计算。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（纬度,经度）
 * @returns Geohash 编解码交互界面
 */
const GeohashCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const initialSample = parseSamplePoint(defaultInput);
  const [mode, setMode] = React.useState<ConvertModeEnum>(ConvertModeEnum.ENCODE);
  const [lat, setLat] = React.useState<number | null>(
    initialSample ? initialSample.lat : DEFAULT_SAMPLE_LAT,
  );
  const [lng, setLng] = React.useState<number | null>(
    initialSample ? initialSample.lng : DEFAULT_SAMPLE_LNG,
  );
  const [precision, setPrecision] = React.useState<number>(DEFAULT_PRECISION);
  const [hashInput, setHashInput] = React.useState<string>(DEFAULT_SAMPLE_HASH);

  const encodeState = React.useMemo(() => {
    if (lat === null || lng === null) {
      return { error: '请输入有效的纬度与经度数值' };
    }
    try {
      const hash = encode(lat, lng, precision);
      const steps = encodeSteps(lat, lng, precision).map<StepRow>((step) => ({
        ...step,
        key: step.index,
      }));
      return { hash, steps };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '编码失败' };
    }
  }, [lat, lng, precision]);

  const decodeState = React.useMemo(() => {
    try {
      return { result: decode(hashInput) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '解码失败' };
    }
  }, [hashInput]);

  /**
   * 载入当前模式的默认示例
   */
  const handleLoadSample = () => {
    if (mode === ConvertModeEnum.ENCODE) {
      setLat(DEFAULT_SAMPLE_LAT);
      setLng(DEFAULT_SAMPLE_LNG);
      setPrecision(DEFAULT_PRECISION);
    } else {
      setHashInput(DEFAULT_SAMPLE_HASH);
    }
  };

  /**
   * 清空当前输入
   */
  const handleClear = () => {
    if (mode === ConvertModeEnum.ENCODE) {
      setLat(null);
      setLng(null);
    } else {
      setHashInput('');
    }
  };

  /**
   * 复制 geohash 或中心点坐标
   *
   * @param text - 待复制文本
   */
  const handleCopy = async (text: string) => {
    if (!text) {
      return;
    }
    await copyToClipboard(text);
    message.success('复制成功');
  };

  const stepColumns: ColumnsType<StepRow> = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 56,
      render: (value: number) => <span className={styles.mono}>{value + 1}</span>,
    },
    {
      title: '字符',
      dataIndex: 'char',
      key: 'char',
      width: 72,
      render: (value: string) => (
        <Tag color="blue" className={styles.monoTag}>
          {value}
        </Tag>
      ),
    },
    {
      title: '5 bit',
      dataIndex: 'bits',
      key: 'bits',
      width: 120,
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '纬度区间',
      key: 'latRange',
      render: (_: unknown, record: StepRow) => (
        <span className={styles.mono}>
          [{formatNumber(record.latRange[0])}, {formatNumber(record.latRange[1])}]
        </span>
      ),
    },
    {
      title: '经度区间',
      key: 'lngRange',
      render: (_: unknown, record: StepRow) => (
        <span className={styles.mono}>
          [{formatNumber(record.lngRange[0])}, {formatNumber(record.lngRange[1])}]
        </span>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.field}>
          <span className={styles.label}>模式：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as ConvertModeEnum)}
            options={MODE_OPTIONS}
          />
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      {mode === ConvertModeEnum.ENCODE ? (
        <>
          <Card title="输入坐标" className={styles.card}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <span className={styles.label}>纬度：</span>
                <InputNumber
                  value={lat}
                  onChange={(value) => setLat(value)}
                  min={-90}
                  max={90}
                  step={0.000001}
                  placeholder="-90 到 90"
                  className={styles.numberInput}
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>经度：</span>
                <InputNumber
                  value={lng}
                  onChange={(value) => setLng(value)}
                  min={-180}
                  max={180}
                  step={0.000001}
                  placeholder="-180 到 180"
                  className={styles.numberInput}
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>精度：</span>
                <Select
                  value={precision}
                  onChange={setPrecision}
                  options={PRECISION_OPTIONS}
                  className={styles.selectInput}
                />
              </div>
            </div>
          </Card>

          {'error' in encodeState && encodeState.error ? (
            <Alert type="error" showIcon message={encodeState.error} />
          ) : (
            'hash' in encodeState &&
            encodeState.hash && (
              <>
                <Card
                  title="Geohash 编码结果"
                  className={styles.card}
                  extra={
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(encodeState.hash ?? '')}
                    >
                      复制
                    </Button>
                  }
                >
                  <div className={styles.resultBox}>{encodeState.hash}</div>
                </Card>

                <Card title="逐字符区间二分过程" size="small">
                  <Table<StepRow>
                    columns={stepColumns}
                    dataSource={encodeState.steps}
                    size="small"
                    pagination={false}
                    scroll={{ x: 560 }}
                  />
                  <div className={styles.hint}>
                    每个字符对应 5 个 bit：偶数位二分经度区间、奇数位二分纬度区间，bit 为 1
                    取上半区间；随字符增加，包含原坐标的区间持续收窄。
                  </div>
                </Card>
              </>
            )
          )}
        </>
      ) : (
        <>
          <Card title="输入 Geohash" className={styles.card}>
            <Input
              value={hashInput}
              onChange={(event) => setHashInput(event.target.value)}
              placeholder="例如 u4pruydqqvj"
              className={styles.monoArea}
              size="large"
            />
            <div className={styles.hint}>
              自动去除首尾空白并将大写转为小写；字母表为 0123456789bcdefghjkmnpqrstuvwxyz（不含
              a、i、l、o）。
            </div>
          </Card>

          {'error' in decodeState && decodeState.error ? (
            <Alert type="error" showIcon message={decodeState.error} />
          ) : (
            'result' in decodeState &&
            decodeState.result && (
              <Card
                title="解码结果"
                className={styles.card}
                extra={
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() =>
                      handleCopy(
                        `${decodeState.result?.latitude},${decodeState.result?.longitude}`,
                      )
                    }
                  >
                    复制中心点
                  </Button>
                }
              >
                <Descriptions
                  bordered
                  size="small"
                  column={{ xs: 1, sm: 1, md: 2 }}
                  items={[
                    {
                      key: 'lat',
                      label: '中心点纬度',
                      children: (
                        <span className={styles.mono}>
                          {formatNumber(decodeState.result.latitude)}
                        </span>
                      ),
                    },
                    {
                      key: 'lng',
                      label: '中心点经度',
                      children: (
                        <span className={styles.mono}>
                          {formatNumber(decodeState.result.longitude)}
                        </span>
                      ),
                    },
                    {
                      key: 'latBox',
                      label: '纬度边界框',
                      children: (
                        <span className={styles.mono}>
                          [{formatNumber(decodeState.result.bbox.minLat)},{' '}
                          {formatNumber(decodeState.result.bbox.maxLat)}]
                        </span>
                      ),
                    },
                    {
                      key: 'lngBox',
                      label: '经度边界框',
                      children: (
                        <span className={styles.mono}>
                          [{formatNumber(decodeState.result.bbox.minLng)},{' '}
                          {formatNumber(decodeState.result.bbox.maxLng)}]
                        </span>
                      ),
                    },
                    {
                      key: 'latErr',
                      label: '纬度误差 ±',
                      children: (
                        <span className={styles.mono}>
                          ±{formatNumber(decodeState.result.error.lat)}
                        </span>
                      ),
                    },
                    {
                      key: 'lngErr',
                      label: '经度误差 ±',
                      children: (
                        <span className={styles.mono}>
                          ±{formatNumber(decodeState.result.error.lng)}
                        </span>
                      ),
                    },
                  ]}
                />
                <div className={styles.hint}>
                  中心点取编码格子区间的中点；误差为格子半宽，精度每增加 1 位（5 个
                  bit），经纬度区间进一步收窄。
                </div>
              </Card>
            )
          )}
        </>
      )}

      <Alert
        type="info"
        showIcon
        message="Geohash 通过 base32 字符交替二分经纬度区间对地球表面做层次化网格编码，相邻位置通常共享前缀，常用于附近搜索、位置聚合与短链接坐标分享。所有转换均在浏览器本地完成，不上传任何位置数据。"
      />
    </div>
  );
};

export default GeohashCodec;
