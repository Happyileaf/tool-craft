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
  Select,
  Space,
  Tabs,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  decode,
  encode,
  isValid,
  recoverLongCode,
  shorten,
  validateCode,
} from './utils/plus-code';
import {
  CODE_LENGTH_OPTIONS,
  DEFAULT_CODE_LENGTH,
  MODE_TABS,
  PlusCodeModeEnum,
  SAMPLE_FULL_CODE,
  SAMPLE_LAT,
  SAMPLE_LNG,
  SAMPLE_REF_LAT,
  SAMPLE_REF_LNG,
  SAMPLE_SHORT_CODE,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 紧凑数值格式化：极小数值走科学计数法，其余保留最多 8 位小数并去尾零。
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
  return value.toFixed(8).replace(/\.?0+$/, '');
}

/**
 * Plus Codes（Open Location Code）编解码器：
 * 经纬度与 Plus Code 双向转换，并支持基于参考点的短码缩短与恢复，全部本地计算。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（纬度,经度）
 * @returns Plus Codes 编解码交互界面
 */
const PlusCodeCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<PlusCodeModeEnum>(PlusCodeModeEnum.ENCODE);

  // 编码面板状态
  const [lat, setLat] = React.useState<number | null>(
    defaultInput ? Number(defaultInput.split(',')[0]) || SAMPLE_LAT : SAMPLE_LAT,
  );
  const [lng, setLng] = React.useState<number | null>(
    defaultInput ? Number(defaultInput.split(',')[1]) || SAMPLE_LNG : SAMPLE_LNG,
  );
  const [codeLength, setCodeLength] = React.useState<number>(DEFAULT_CODE_LENGTH);

  // 解码面板状态
  const [codeInput, setCodeInput] = React.useState<string>(SAMPLE_FULL_CODE);

  // 短码面板状态
  const [shortFullCode, setShortFullCode] = React.useState<string>(SAMPLE_FULL_CODE);
  const [shortCodeInput, setShortCodeInput] = React.useState<string>(SAMPLE_SHORT_CODE);
  const [refLat, setRefLat] = React.useState<number | null>(SAMPLE_REF_LAT);
  const [refLng, setRefLng] = React.useState<number | null>(SAMPLE_REF_LNG);

  const encodeState = React.useMemo(() => {
    if (lat === null || lng === null) {
      return { error: '请输入有效的纬度与经度数值' };
    }
    try {
      return { code: encode(lat, lng, codeLength) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '编码失败' };
    }
  }, [lat, lng, codeLength]);

  const decodeState = React.useMemo(() => {
    const trimmed = codeInput.trim();
    if (!trimmed) {
      return { error: '请输入 Plus Code' };
    }
    const invalid = validateCode(trimmed);
    if (invalid) {
      return { error: invalid };
    }
    try {
      return { result: decode(trimmed) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '解码失败' };
    }
  }, [codeInput]);

  const shortenState = React.useMemo(() => {
    const trimmed = shortFullCode.trim();
    if (!trimmed) {
      return { error: '请输入完整 Plus Code' };
    }
    if (refLat === null || refLng === null) {
      return { error: '请输入有效的参考点经纬度' };
    }
    try {
      return { code: shorten(trimmed, refLat, refLng) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '缩短失败' };
    }
  }, [shortFullCode, refLat, refLng]);

  const recoverState = React.useMemo(() => {
    const trimmed = shortCodeInput.trim();
    if (!trimmed) {
      return { error: '请输入短码' };
    }
    if (refLat === null || refLng === null) {
      return { error: '请输入有效的参考点经纬度' };
    }
    try {
      return { code: recoverLongCode(trimmed, refLat, refLng) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '恢复失败' };
    }
  }, [shortCodeInput, refLat, refLng]);

  /**
   * 复制文本并给出提示
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

  /** 载入当前面板示例 */
  const handleLoadSample = () => {
    if (mode === PlusCodeModeEnum.ENCODE) {
      setLat(SAMPLE_LAT);
      setLng(SAMPLE_LNG);
      setCodeLength(DEFAULT_CODE_LENGTH);
    } else if (mode === PlusCodeModeEnum.DECODE) {
      setCodeInput(SAMPLE_FULL_CODE);
    } else {
      setShortFullCode(SAMPLE_FULL_CODE);
      setShortCodeInput(SAMPLE_SHORT_CODE);
      setRefLat(SAMPLE_REF_LAT);
      setRefLng(SAMPLE_REF_LNG);
    }
  };

  /** 清空当前面板输入 */
  const handleClear = () => {
    if (mode === PlusCodeModeEnum.ENCODE) {
      setLat(null);
      setLng(null);
    } else if (mode === PlusCodeModeEnum.DECODE) {
      setCodeInput('');
    } else {
      setShortFullCode('');
      setShortCodeInput('');
    }
  };

  const encodePanel = (
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
            <span className={styles.label}>码长：</span>
            <Select
              value={codeLength}
              onChange={setCodeLength}
              options={CODE_LENGTH_OPTIONS}
              className={styles.selectInput}
            />
          </div>
        </div>
      </Card>

      {'error' in encodeState && encodeState.error ? (
        <Alert type="error" showIcon message={encodeState.error} />
      ) : (
        'code' in encodeState &&
        encodeState.code && (
          <Card
            title="Plus Code 编码结果"
            className={styles.card}
            extra={
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(encodeState.code ?? '')}
              >
                复制
              </Button>
            }
          >
            <div className={styles.resultBox}>{encodeState.code}</div>
            <div className={styles.hint}>
              前 8 个字符后以 + 分隔；码长越长格子越小，10 位标准精度在赤道附近约为
              14m × 14m。纬度自动钳制到 ±90，经度自动归一化到 ±180。
            </div>
          </Card>
        )
      )}
    </>
  );

  const decodePanel = (
    <>
      <Card title="输入 Plus Code" className={styles.card}>
        <Input
          value={codeInput}
          onChange={(event) => setCodeInput(event.target.value)}
          placeholder="例如 8FVC9G8F+6X"
          className={styles.monoArea}
          size="large"
        />
        <div className={styles.hint}>
          自动去除首尾空白并转大写；仅支持完整码（+ 位于第 9 个字符位置），短码请在「短码」面板先恢复。
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
                    `${decodeState.result?.latitudeCenter},${decodeState.result?.longitudeCenter}`,
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
                  key: 'center',
                  label: '中心点（纬度, 经度）',
                  children: (
                    <span className={styles.mono}>
                      {formatNumber(decodeState.result.latitudeCenter)},{' '}
                      {formatNumber(decodeState.result.longitudeCenter)}
                    </span>
                  ),
                },
                {
                  key: 'length',
                  label: '有效码长',
                  children: <Tag color="blue">{decodeState.result.codeLength} 位</Tag>,
                },
                {
                  key: 'latBox',
                  label: '纬度区间',
                  children: (
                    <span className={styles.mono}>
                      [{formatNumber(decodeState.result.latitudeLo)},{' '}
                      {formatNumber(decodeState.result.latitudeHi)}]
                    </span>
                  ),
                },
                {
                  key: 'lngBox',
                  label: '经度区间',
                  children: (
                    <span className={styles.mono}>
                      [{formatNumber(decodeState.result.longitudeLo)},{' '}
                      {formatNumber(decodeState.result.longitudeHi)}]
                    </span>
                  ),
                },
                {
                  key: 'latPrecision',
                  label: '格子纬度高度',
                  children: (
                    <span className={styles.mono}>
                      {formatNumber(decodeState.result.latitudePrecision)}°
                    </span>
                  ),
                },
                {
                  key: 'lngPrecision',
                  label: '格子经度宽度',
                  children: (
                    <span className={styles.mono}>
                      {formatNumber(decodeState.result.longitudePrecision)}°
                    </span>
                  ),
                },
              ]}
            />
            <div className={styles.hint}>
              解码结果为一个编码格子而非单点；中心点是格子中点，区间为格子的西南—东北边界框。
            </div>
          </Card>
        )
      )}
    </>
  );

  const shortenPanel = (
    <>
      <Card title="参考点（短码缩短 / 恢复所需的大致位置）" className={styles.card}>
        <div className={styles.refRow}>
          <div className={styles.field}>
            <span className={styles.label}>参考纬度：</span>
            <InputNumber
              value={refLat}
              onChange={setRefLat}
              min={-90}
              max={90}
              step={0.0001}
              className={styles.numberInput}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>参考经度：</span>
            <InputNumber
              value={refLng}
              onChange={setRefLng}
              min={-180}
              max={180}
              step={0.0001}
              className={styles.numberInput}
            />
          </div>
        </div>
      </Card>

      <Card title="完整码 → 短码（shorten）" className={styles.card}>
        <Input
          value={shortFullCode}
          onChange={(event) => setShortFullCode(event.target.value)}
          placeholder="完整 Plus Code，例如 8FVC9G8F+6X"
          className={styles.monoArea}
        />
        {'error' in shortenState && shortenState.error ? (
          <Alert className={styles.card} type="error" showIcon message={shortenState.error} />
        ) : (
          'code' in shortenState &&
          shortenState.code && (
            <>
              <div className={styles.resultBox}>{shortenState.code}</div>
              <Space style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(shortenState.code ?? '')}
                >
                  复制短码
                </Button>
              </Space>
            </>
          )
        )}
        <div className={styles.hint}>
          参考点距离格子越近，可去掉的前缀越多（最短可缩为 +XX 形式）；含零填充的低精度码不能缩短。
        </div>
      </Card>

      <Card title="短码 → 完整码（recover，用同一参考点恢复）" className={styles.card}>
        <Input
          value={shortCodeInput}
          onChange={(event) => setShortCodeInput(event.target.value)}
          placeholder="短码，例如 8F+6X 或 +6X"
          className={styles.monoArea}
        />
        {'error' in recoverState && recoverState.error ? (
          <Alert className={styles.card} type="error" showIcon message={recoverState.error} />
        ) : (
          'code' in recoverState &&
          recoverState.code && (
            <>
              <div className={styles.resultBox}>{recoverState.code}</div>
              <Space style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(recoverState.code ?? '')}
                >
                  复制完整码
                </Button>
                {isValid(recoverState.code) && <Tag color="green">恢复结果合法</Tag>}
              </Space>
            </>
          )
        )}
        <div className={styles.hint}>
          短码本身不含全局位置信息，必须借助参考点补齐前缀；恢复结果取距离参考点最近的同后缀格子。
        </div>
      </Card>
    </>
  );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tabs
          activeKey={mode}
          onChange={(key) => setMode(key as PlusCodeModeEnum)}
          items={MODE_TABS}
        />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      {mode === PlusCodeModeEnum.ENCODE && encodePanel}
      {mode === PlusCodeModeEnum.DECODE && decodePanel}
      {mode === PlusCodeModeEnum.SHORTEN && shortenPanel}

      <Alert
        type="info"
        showIcon
        message="Plus Codes（Open Location Code）是 Google 提出的开源位置编码：用 Base20 层次格网把经纬度压缩成可口头传递的短码（如 8FVC9G8F+6X），字母表去除元音与易混字符。所有编解码均在浏览器本地完成，不上传任何位置数据，算法与官方参考实现逐位对齐。"
      />
    </div>
  );
};

export default PlusCodeCodec;
