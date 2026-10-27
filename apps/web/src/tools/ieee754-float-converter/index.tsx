'use client';

import React from 'react';
import { Alert, Button, Card, Descriptions, Input, Radio, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_SAMPLE,
  MODE_OPTIONS,
  ModeEnum,
  PRECISION_CONFIG,
  PRECISION_OPTIONS,
  PrecisionEnum,
} from './constants';
import {
  decodeBits,
  encodeFloat,
  parseDecimal,
  type EncodedFloat,
} from './utils/ieee754';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface FieldRow {
  key: string;
  name: string;
  width: string;
  bits: string;
  meaning: string;
}

const SPECIAL_TAG_TEXT: Record<string, string> = {
  none: '普通规约数',
  zero: '有符号零',
  inf: '无穷大',
  nan: 'NaN',
};

/**
 * IEEE 754 浮点数转换器：在十进制数值与 32 位 / 64 位的二进制、
 * 十六进制位表示之间互转，并拆解符号位、偏置指数与尾数位域。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns IEEE 754 转换交互界面
 */
const Ieee754FloatConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [precision, setPrecision] = React.useState<PrecisionEnum>(PrecisionEnum.DOUBLE_64);
  const [mode, setMode] = React.useState<ModeEnum>(ModeEnum.DECIMAL_TO_BITS);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);

  const config = PRECISION_CONFIG[precision];

  const encodeResult = React.useMemo<
    { encoded: EncodedFloat; storedValue: number } | { error: string } | null
  >(() => {
    if (mode !== ModeEnum.DECIMAL_TO_BITS) {
      return null;
    }
    try {
      const value = parseDecimal(input);
      const encoded = encodeFloat(value, precision);
      return { encoded, storedValue: value };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : '编码失败' };
    }
  }, [input, mode, precision]);

  const decodeResult = React.useMemo<
    { text: string; special: string } | { error: string } | null
  >(() => {
    if (mode !== ModeEnum.BITS_TO_DECIMAL) {
      return null;
    }
    try {
      const decoded = decodeBits(input, precision);
      const value = decoded.value;
      let text: string;
      if (Number.isNaN(value)) {
        text = 'NaN';
      } else if (value === Number.POSITIVE_INFINITY) {
        text = 'Infinity';
      } else if (value === Number.NEGATIVE_INFINITY) {
        text = '-Infinity';
      } else if (Object.is(value, -0)) {
        text = '-0';
      } else {
        text = String(value);
      }
      return { text, special: decoded.isSpecial };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : '解码失败' };
    }
  }, [input, mode, precision]);

  /** 单精度实际存储值（double 读出以展示 round-to-nearest 结果） */
  const storedFloat32 = React.useMemo(() => {
    if (precision !== PrecisionEnum.SINGLE_32 || !encodeResult || 'error' in encodeResult) {
      return null;
    }
    const value = encodeResult.storedValue;
    if (!Number.isFinite(value)) {
      return null;
    }
    const view = new DataView(new Float32Array([value]).buffer);
    return view.getFloat32(0, false);
  }, [encodeResult, precision]);

  const fieldRows = React.useMemo<FieldRow[]>(() => {
    if (!encodeResult || 'error' in encodeResult) {
      return [];
    }
    const { encoded } = encodeResult;
    return [
      {
        key: 'sign',
        name: '符号位',
        width: '1 位',
        bits: String(encoded.sign),
        meaning: encoded.sign === 1 ? '1 = 负数' : '0 = 正数',
      },
      {
        key: 'exponent',
        name: '指数位（含偏置）',
        width: `${config.exponentBits} 位`,
        bits: encoded.exponentBits,
        meaning: `去偏置指数 = ${encoded.exponentValue}（偏置 ${config.bias}）`,
      },
      {
        key: 'mantissa',
        name: '尾数位（不含隐藏位）',
        width: `${config.mantissaBits} 位`,
        bits: encoded.mantissaBits,
        meaning: `尾数十六进制 0x${encoded.mantissaHex}`,
      },
    ];
  }, [config, encodeResult]);

  const columns: ColumnsType<FieldRow> = [
    { title: '位域', dataIndex: 'name', key: 'name', width: 180 },
    { title: '位宽', dataIndex: 'width', key: 'width', width: 90 },
    {
      title: '位值',
      dataIndex: 'bits',
      key: 'bits',
      render: (value: string) => <span className={styles.bitsCell}>{value}</span>,
    },
    { title: '含义', dataIndex: 'meaning', key: 'meaning' },
  ];

  /** 复制当前结果文本 */
  const handleCopy = async () => {
    let text = '';
    if (mode === ModeEnum.DECIMAL_TO_BITS && encodeResult && !('error' in encodeResult)) {
      text = `0x${encodeResult.encoded.hex}\n${encodeResult.encoded.binary}`;
    } else if (mode === ModeEnum.BITS_TO_DECIMAL && decodeResult && !('error' in decodeResult)) {
      text = decodeResult.text;
    }
    if (!text) {
      return;
    }
    try {
      await copyToClipboard(text);
      message.success('已复制结果');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  /** 切换精度时载入一个有代表性的示例 */
  const handleLoadSample = () => {
    setInput(DEFAULT_SAMPLE);
  };

  const inputPlaceholder =
    mode === ModeEnum.DECIMAL_TO_BITS
      ? '输入十进制数值，如 0.1、-3.25、1e10；也支持 Infinity、-Infinity、NaN'
      : `输入 ${config.totalBits} 位二进制串或 ${config.totalBits / 4} 位十六进制串（支持 0b / 0x 前缀）`;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space size="large" wrap>
          <Space>
            <span>精度</span>
            <Radio.Group
              value={precision}
              onChange={(event) => setPrecision(event.target.value as PrecisionEnum)}
              optionType="button"
              buttonStyle="solid"
              options={PRECISION_OPTIONS}
            />
          </Space>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value as ModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={MODE_OPTIONS}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制结果
          </Button>
        </Space>
      </div>

      <Card
        title={
          mode === ModeEnum.DECIMAL_TO_BITS ? '输入十进制数值' : '输入二进制 / 十六进制位串'
        }
        className={styles.card}
      >
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={inputPlaceholder}
          autoSize={{ minRows: 2, maxRows: 6 }}
          spellCheck={false}
          className={styles.editor}
        />
      </Card>

      {mode === ModeEnum.DECIMAL_TO_BITS ? (
        encodeResult && 'error' in encodeResult ? (
          <Alert type="error" showIcon message={encodeResult.error} />
        ) : encodeResult ? (
          <>
            <Card title="转换结果" className={styles.card}>
              <Space direction="vertical" size={12} className={styles.resultBlock}>
                <Space size={8} wrap>
                  <span className={styles.label}>十六进制：</span>
                  <span className={styles.monoValue}>0x{encodeResult.encoded.hex}</span>
                  <Tag color="blue">{config.totalBits} 位</Tag>
                  <Tag>{SPECIAL_TAG_TEXT[encodeResult.encoded.isSpecial]}</Tag>
                </Space>
                <Space size={8} wrap align="start">
                  <span className={styles.label}>二进制：</span>
                  <span className={styles.bitStream}>
                    <b className={styles.signBit}>{encodeResult.encoded.sign}</b>
                    <span className={styles.expBit}>
                      {encodeResult.encoded.exponentBits}
                    </span>
                    <span className={styles.manBit}>{encodeResult.encoded.mantissaBits}</span>
                  </span>
                </Space>
                <div className={styles.legend}>
                  <Tag color="red">符号（1）</Tag>
                  <Tag color="gold">指数（{config.exponentBits}）</Tag>
                  <Tag color="green">尾数（{config.mantissaBits}）</Tag>
                </div>
                {storedFloat32 !== null &&
                storedFloat32 !== encodeResult.storedValue ? (
                  <Alert
                    type="info"
                    showIcon
                    message={`单精度按 round-to-nearest 存储，实际存储值为 ${String(storedFloat32)}`}
                  />
                ) : null}
              </Space>
            </Card>
            <Card title="位域拆解" className={styles.card}>
              <Table<FieldRow>
                columns={columns}
                dataSource={fieldRows}
                pagination={false}
                size="small"
              />
            </Card>
          </>
        ) : null
      ) : decodeResult && 'error' in decodeResult ? (
        <Alert type="error" showIcon message={decodeResult.error} />
      ) : decodeResult ? (
        <Card title="转换结果" className={styles.card}>
          <Space direction="vertical" size={12}>
            <Space size={8} wrap>
              <span className={styles.label}>十进制值：</span>
              <span className={styles.monoValue}>{decodeResult.text}</span>
              <Tag>{SPECIAL_TAG_TEXT[decodeResult.special]}</Tag>
            </Space>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="识别进制">
                按位串内容自动识别（可用 0b / 0x 前缀强制指定）
              </Descriptions.Item>
              <Descriptions.Item label="精度">
                {precision === PrecisionEnum.SINGLE_32
                  ? 'IEEE 754 binary32（单精度）'
                  : 'IEEE 754 binary64（双精度）'}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      ) : null}

      <Alert
        className={styles.hint}
        type="info"
        showIcon
        message="IEEE 754 小知识"
        description={
          <ul className={styles.hintList}>
            <li>
              0.1 无法用二进制浮点精确表示：双精度实际存储值约为
              0.10000000000000000555，这是 0.1 + 0.2 ≠ 0.3 的根本原因。
            </li>
            <li>
              指数字段带偏置（32 位 bias=127、64 位 bias=1023）：实际指数 = 指数字段值 −
              bias，这样指数可按无符号整数直接比较大小。
            </li>
            <li>
              32 位为 1+8+23（约 7 位十进制有效数字），64 位为 1+11+52（约 15–17
              位有效数字）；指数全 1 时尾数为 0 表示 Infinity、非 0 表示 NaN。
            </li>
            <li>所有运算均在浏览器本地通过 ArrayBuffer / DataView 完成，数据不会上传。</li>
          </ul>
        }
      />
    </div>
  );
};

export default Ieee754FloatConverter;
