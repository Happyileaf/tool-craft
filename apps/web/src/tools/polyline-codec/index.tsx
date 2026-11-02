'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  ALTERNATIVE_PRECISION,
  DEFAULT_ENCODED,
  DEFAULT_INPUT,
  DEFAULT_PRECISION,
  EMPTY_TEXT,
  ENCODED_HINT,
  POINTS_HINT,
} from './constants';
import {
  decodePolyline,
  encodePolyline,
  formatPointsText,
  parsePointsText,
} from './utils/polyline';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Encoded Polyline 折线编解码工具：左侧坐标点实时编码，右侧编码字符串实时解码，
 * 支持精度 5（传统 Google Maps API）与精度 6（新版 Routes API），全部本地运算。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（坐标文本）
 * @returns Polyline 编解码交互界面
 */
const PolylineCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [pointsText, setPointsText] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [encodedText, setEncodedText] = React.useState<string>(DEFAULT_ENCODED);
  const [precision, setPrecision] = React.useState<number>(DEFAULT_PRECISION);

  // 坐标侧：解析后实时编码
  const parsed = React.useMemo(() => parsePointsText(pointsText), [pointsText]);
  const encodeResult = React.useMemo(() => {
    if (pointsText.trim() === '') {
      return { output: null, error: null };
    }
    if (parsed.error) {
      return { output: null, error: parsed.error };
    }
    return encodePolyline(parsed.points ?? [], precision);
  }, [parsed, precision, pointsText]);

  // 编码侧：实时解码
  const decodeResult = React.useMemo(
    () => (encodedText.trim() === '' ? { points: null, error: null } : decodePolyline(encodedText, precision)),
    [encodedText, precision],
  );

  const handleCopyEncoded = async () => {
    if (!encodeResult.output) {
      return;
    }
    await copyToClipboard(encodeResult.output);
    message.success('编码字符串已复制');
  };

  const handleCopyPoints = async () => {
    if (!decodeResult.points) {
      return;
    }
    await copyToClipboard(formatPointsText(decodeResult.points));
    message.success('坐标列表已复制');
  };

  const reset = () => {
    setPointsText(DEFAULT_INPUT);
    setEncodedText(DEFAULT_ENCODED);
    setPrecision(DEFAULT_PRECISION);
  };

  return (
    <div className={styles.container}>
      <Card
        title="Encoded Polyline 折线编解码"
        extra={
          <Space>
            <span className={styles.label}>编码精度：</span>
            <Select
              className={styles.precisionSelect}
              value={precision}
              onChange={(value) => setPrecision(value)}
              options={[
                { value: DEFAULT_PRECISION, label: '精度 5（传统 Google Maps / Directions API）' },
                { value: ALTERNATIVE_PRECISION, label: '精度 6（新版 Routes API v1）' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={reset}>
              载入示例
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setPointsText('');
                setEncodedText('');
              }}
            >
              清空
            </Button>
          </Space>
        }
      >
        <div className={styles.toolbar}>
          <span className={styles.label}>坐标点（纬度,经度）→ 实时编码：</span>
          {parsed.points && <Tag color="blue">{parsed.points.length} 个点</Tag>}
        </div>
        <Input.TextArea
          className={styles.textarea}
          value={pointsText}
          onChange={(event) => setPointsText(event.target.value)}
          placeholder="每行一个点：纬度,经度"
          autoSize={{ minRows: 5, maxRows: 14 }}
          style={{ marginTop: 8 }}
        />
        <div className={styles.hint}>{POINTS_HINT}</div>
        {encodeResult.error && (
          <Alert
            style={{ marginTop: 8 }}
            type="error"
            showIcon
            message="无法编码"
            description={encodeResult.error}
          />
        )}
      </Card>

      <Card
        title="编码结果"
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopyEncoded}
            disabled={Boolean(encodeResult.error) || !encodeResult.output}
          >
            复制编码
          </Button>
        }
      >
        {encodeResult.output ? (
          <Input.TextArea
            className={styles.encodedOutput}
            value={encodeResult.output}
            readOnly
            autoSize={{ minRows: 2, maxRows: 8 }}
          />
        ) : (
          !encodeResult.error && <Alert type="info" showIcon message={EMPTY_TEXT} />
        )}
      </Card>

      <Card
        title="Polyline 字符串解码"
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopyPoints}
            disabled={Boolean(decodeResult.error) || !decodeResult.points}
          >
            复制坐标
          </Button>
        }
      >
        <Input.TextArea
          className={styles.encodedOutput}
          value={encodedText}
          onChange={(event) => setEncodedText(event.target.value)}
          placeholder="粘贴 Polyline 编码字符串（如 _p~iF~ps|U_ulLnnqC_mqNvxq`@）"
          autoSize={{ minRows: 2, maxRows: 8 }}
        />
        <div className={styles.hint}>{ENCODED_HINT}</div>
        {decodeResult.error && (
          <Alert
            style={{ marginTop: 8 }}
            type="error"
            showIcon
            message="无法解码"
            description={decodeResult.error}
          />
        )}
        {decodeResult.points && (
          <Alert
            style={{ marginTop: 8 }}
            type="success"
            showIcon
            message={`解码成功，共 ${decodeResult.points.length} 个坐标点`}
            description={
              <Input.TextArea
                className={styles.textarea}
                value={formatPointsText(decodeResult.points)}
                readOnly
                autoSize={{ minRows: 3, maxRows: 12 }}
              />
            }
          />
        )}
      </Card>
    </div>
  );
};

export default PolylineCodec;
