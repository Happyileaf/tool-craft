'use client';

import React from 'react';
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
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  encode,
  decode,
  isValid,
  isShortCode,
  shorten,
  recoverNearest,
  computeLatitudePrecision,
  type CodeArea,
} from './utils/openLocationCode';
import {
  CODE_LENGTH_OPTIONS,
  DEFAULT_CODE_LENGTH,
  DEFAULT_FULL_CODE,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_SHORT_CODE,
  MODE_OPTIONS,
  type PlusCodeMode,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && Math.abs(value) < 0.000001) return value.toExponential(4);
  return value.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
}

const PlusCodeCodec: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<PlusCodeMode>('encode');

  // 编码模式状态
  const [latitude, setLatitude] = React.useState<number | null>(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = React.useState<number | null>(DEFAULT_LONGITUDE);
  const [codeLength, setCodeLength] = React.useState<number>(DEFAULT_CODE_LENGTH);

  // 解码模式状态
  const [codeInput, setCodeInput] = React.useState<string>(DEFAULT_FULL_CODE);

  // 短码模式状态
  const [shortInput, setShortInput] = React.useState<string>(DEFAULT_SHORT_CODE);
  const [refLat, setRefLat] = React.useState<number | null>(51.3852125);
  const [refLng, setRefLng] = React.useState<number | null>(-1.217765625);

  const activeOption = MODE_OPTIONS.find((option) => option.value === mode);

  // ---------- 编码结果 ----------
  const encodeResult = React.useMemo(() => {
    if (mode !== 'encode' || latitude === null || longitude === null) return null;
    try {
      return {
        code: encode(latitude, longitude, { codeLength }),
        error: null as string | null,
      };
    } catch (error) {
      return { code: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, latitude, longitude, codeLength]);

  // ---------- 解码结果 ----------
  const decodeResult = React.useMemo<{
    area: CodeArea | null;
    error: string | null;
  }>(() => {
    if (mode !== 'decode') return { area: null, error: null };
    const trimmed = codeInput.trim();
    if (trimmed === '') return { area: null, error: null };
    try {
      return { area: decode(trimmed), error: null };
    } catch (error) {
      return { area: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, codeInput]);

  // ---------- 短码结果 ----------
  const shortenResult = React.useMemo(() => {
    if (mode !== 'shorten' || refLat === null || refLng === null) return null;
    const trimmed = shortInput.trim();
    if (trimmed === '') return null;
    try {
      if (isShortCode(trimmed)) {
        return {
          direction: 'recover' as const,
          output: recoverNearest(trimmed, refLat, refLng),
          error: null as string | null,
        };
      }
      if (isValid(trimmed)) {
        return {
          direction: 'shorten' as const,
          output: shorten(trimmed, refLat, refLng),
          error: null as string | null,
        };
      }
      return { direction: null, output: null, error: '输入不是合法的 Plus Code' };
    } catch (error) {
      return {
        direction: null,
        output: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [mode, shortInput, refLat, refLng]);

  const handleCopy = (text: string | null) => {
    if (!text) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  return (
    <div className={styles.container}>
      <Card size="small" title="处理模式">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => setMode(e.target.value as PlusCodeMode)}
          />
          <span className={styles.hint}>{activeOption?.hint}</span>
        </div>
      </Card>

      {mode === 'encode' && (
        <div className={styles.panels}>
          <Card className={styles.card} title="输入坐标（WGS-84 十进制度）">
            <Space direction="vertical" className={styles.fullWidth} size="middle">
              <div>
                <div className={styles.fieldLabel}>纬度 Latitude（-90 ~ 90）</div>
                <InputNumber
                  value={latitude}
                  onChange={(value) => setLatitude(value)}
                  min={-90}
                  max={90}
                  step={0.000001}
                  style={{ width: '100%' }}
                  placeholder="例如 20.3701135"
                />
              </div>
              <div>
                <div className={styles.fieldLabel}>经度 Longitude（-180 ~ 180，自动回绕）</div>
                <InputNumber
                  value={longitude}
                  onChange={(value) => setLongitude(value)}
                  step={0.000001}
                  style={{ width: '100%' }}
                  placeholder="例如 2.78223535156"
                />
              </div>
              <div>
                <div className={styles.fieldLabel}>有效码长</div>
                <Select
                  value={codeLength}
                  onChange={setCodeLength}
                  style={{ width: '100%' }}
                  options={CODE_LENGTH_OPTIONS.map((value) => ({
                    value,
                    label: `${value} 位（纬度精度约 ${formatNumber(computeLatitudePrecision(value))}°）`,
                  }))}
                />
              </div>
            </Space>
          </Card>

          <Card
            className={styles.card}
            title="Plus Code"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(encodeResult?.code ?? null)}
              >
                复制
              </Button>
            }
          >
            {encodeResult?.error ? (
              <Alert type="error" showIcon message={encodeResult.error} />
            ) : encodeResult?.code ? (
              <div className={styles.resultList}>
                <div className={styles.resultRow}>
                  <span className={styles.code}>{encodeResult.code}</span>
                  <Tag color="blue">{codeLength} 位</Tag>
                </div>
                <p className={styles.summary}>
                  码长 {codeLength} 对应纬度方向精度约 {formatNumber(computeLatitudePrecision(codeLength))}°
                </p>
              </div>
            ) : (
              <Alert type="info" showIcon message="请输入有效的纬度与经度" />
            )}
          </Card>
        </div>
      )}

      {mode === 'decode' && (
        <div className={styles.panels}>
          <Card className={styles.card} title="输入完整 Plus Code">
            <Input
              value={codeInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCodeInput(e.target.value)}
              spellCheck={false}
              className={styles.editor}
              placeholder="例如 7FG49QCJ+2VX"
            />
            <div className={styles.statusRow}>
              {codeInput.trim() !== '' && (
                isValid(codeInput.trim()) ? (
                  <Tag color="green">结构合法</Tag>
                ) : (
                  <Tag color="red">结构非法</Tag>
                )
              )}
              {codeInput.trim() !== '' && isShortCode(codeInput.trim()) && (
                <Tag color="orange">短码：解码需先用参考位置还原</Tag>
              )}
            </div>
          </Card>

          <Card className={styles.card} title="编码区域">
            {decodeResult?.error ? (
              <Alert type="error" showIcon message={decodeResult.error} />
            ) : decodeResult?.area ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="中心纬度">{formatNumber(decodeResult.area.latitudeCenter)}</Descriptions.Item>
                <Descriptions.Item label="中心经度">{formatNumber(decodeResult.area.longitudeCenter)}</Descriptions.Item>
                <Descriptions.Item label="南界 / 北界">
                  {formatNumber(decodeResult.area.latitudeLo)} ~ {formatNumber(decodeResult.area.latitudeHi)}
                </Descriptions.Item>
                <Descriptions.Item label="西界 / 东界">
                  {formatNumber(decodeResult.area.longitudeLo)} ~ {formatNumber(decodeResult.area.longitudeHi)}
                </Descriptions.Item>
                <Descriptions.Item label="有效码长">{decodeResult.area.codeLength}</Descriptions.Item>
                <Descriptions.Item label="区域高度 / 宽度（度）">
                  {formatNumber(decodeResult.area.latitudeHi - decodeResult.area.latitudeLo)} /{' '}
                  {formatNumber(decodeResult.area.longitudeHi - decodeResult.area.longitudeLo)}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert type="info" showIcon message="请输入需要解码的完整 Plus Code" />
            )}
          </Card>
        </div>
      )}

      {mode === 'shorten' && (
        <div className={styles.panels}>
          <Card className={styles.card} title="输入 Plus Code（完整码或短码）与参考位置">
            <Space direction="vertical" className={styles.fullWidth} size="middle">
              <Input
                value={shortInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShortInput(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                placeholder="完整码如 9C3W9QCJ+2VX，或短码如 9QCJ+2VX"
              />
              <div>
                <div className={styles.fieldLabel}>参考点纬度</div>
                <InputNumber
                  value={refLat}
                  onChange={(value) => setRefLat(value)}
                  min={-90}
                  max={90}
                  step={0.000001}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div className={styles.fieldLabel}>参考点经度</div>
                <InputNumber
                  value={refLng}
                  onChange={(value) => setRefLng(value)}
                  step={0.000001}
                  style={{ width: '100%' }}
                />
              </div>
              <p className={styles.summary}>
                输入完整码时按参考点缩短；输入短码时用参考点还原为完整码。
              </p>
            </Space>
          </Card>

          <Card
            className={styles.card}
            title="转换结果"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(shortenResult?.output ?? null)}
              >
                复制
              </Button>
            }
          >
            {shortenResult?.error ? (
              <Alert type="error" showIcon message={shortenResult.error} />
            ) : shortenResult?.output ? (
              <div className={styles.resultList}>
                <div className={styles.resultRow}>
                  <span className={styles.code}>{shortenResult.output}</span>
                  <Tag color={shortenResult.direction === 'shorten' ? 'purple' : 'geekblue'}>
                    {shortenResult.direction === 'shorten' ? '缩短结果' : '还原结果'}
                  </Tag>
                </div>
              </div>
            ) : (
              <Alert type="info" showIcon message="请输入 Plus Code 与参考位置" />
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlusCodeCodec;
