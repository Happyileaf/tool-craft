'use client';

import { Alert, Button, Card, Input, Radio, Select, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { CRC_PRESETS, INPUT_MODE, type InputMode } from './constants';
import styles from './index.module.css';
import {
  computeCrc,
  encodeUtf8,
  formatCrcHex,
  parseHexBytes,
  verifyModel,
  type CrcModel,
} from './utils/crc';

const { Text } = Typography;

/**
 * CRC 多参数模型计算器
 *
 * 通用 BigInt CRC 引擎覆盖 width 1–64，内置 12 个标准预设，
 * 支持 UTF-8 文本与十六进制字节两种输入，并可同屏对比全部模型。
 */
export default function CrcModelCalculator() {
  const [presetName, setPresetName] = useState<string>(CRC_PRESETS[8]!.name);
  const [inputMode, setInputMode] = useState<InputMode>(INPUT_MODE.TEXT);
  const [textInput, setTextInput] = useState('123456789');
  const [hexInput, setHexInput] = useState('31 32 33 34 35 36 37 38 39');

  const model: CrcModel = useMemo(
    () => CRC_PRESETS.find((item) => item.name === presetName) ?? CRC_PRESETS[0]!,
    [presetName],
  );

  const bytes = useMemo(() => {
    try {
      if (inputMode === INPUT_MODE.TEXT) {
        return { ok: true as const, data: encodeUtf8(textInput) };
      }
      return { ok: true as const, data: parseHexBytes(hexInput) };
    } catch (caught) {
      return { ok: false as const, error: caught instanceof Error ? caught.message : '输入解析失败' };
    }
  }, [inputMode, textInput, hexInput]);

  const currentCrc = useMemo(() => {
    if (!bytes.ok) {
      return null;
    }
    return computeCrc(bytes.data, model);
  }, [bytes, model]);

  const selfCheck = useMemo(() => verifyModel(model), [model]);

  const allModelRows = useMemo(() => {
    if (!bytes.ok) {
      return [];
    }
    return CRC_PRESETS.map((item) => ({
      key: item.name,
      name: item.name,
      width: item.width,
      value: formatCrcHex(computeCrc(bytes.data, item), item.width),
    }));
  }, [bytes]);

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择文本');
    }
  };

  return (
    <div className={styles.container}>
      <Card size="small" title="模型与输入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>CRC 模型（12 个标准预设）</span>
            <Select
              showSearch
              style={{ width: '100%' }}
              value={presetName}
              onChange={(value) => setPresetName(value)}
              options={CRC_PRESETS.map((item) => ({
                label: `${item.name}（width=${item.width}）`,
                value: item.name,
              }))}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>width</span>
              <span className={styles.metaValue}>{model.width}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>poly</span>
              <span className={styles.metaValue}>0x{model.poly.toString(16).toUpperCase()}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>init</span>
              <span className={styles.metaValue}>0x{model.init.toString(16).toUpperCase()}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>refIn / refOut</span>
              <span className={styles.metaValue}>
                {model.refIn ? 'true' : 'false'} / {model.refOut ? 'true' : 'false'}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>xorOut</span>
              <span className={styles.metaValue}>0x{model.xorOut.toString(16).toUpperCase()}</span>
            </div>
          </div>

          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={inputMode}
            onChange={(event) => setInputMode(event.target.value as InputMode)}
            options={[
              { label: 'UTF-8 文本', value: INPUT_MODE.TEXT },
              { label: '十六进制字节', value: INPUT_MODE.HEX },
            ]}
          />

          {inputMode === INPUT_MODE.TEXT ? (
            <Input.TextArea
              rows={3}
              placeholder="输入任意 UTF-8 文本"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
            />
          ) : (
            <Input.TextArea
              rows={3}
              placeholder="例如 31 32 33 或 0x31,0x32 或连续 313233"
              value={hexInput}
              onChange={(event) => setHexInput(event.target.value)}
            />
          )}
          {bytes.ok && (
            <span className={styles.hint}>
              实际参与计算的字节数：{bytes.data.length}
              {bytes.data.length > 0 && bytes.data.length <= 32 && (
                <> ｜ {Array.from(bytes.data).map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')}</>
              )}
            </span>
          )}
        </Space>
      </Card>

      {!bytes.ok ? (
        <Alert type="error" showIcon message={bytes.error} />
      ) : (
        <div className={styles.resultCard}>
          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Tag color="blue">{model.name}</Tag>
            {currentCrc !== null && (
              <Button size="small" onClick={() => copyValue(formatCrcHex(currentCrc, model.width))}>
                复制 CRC
              </Button>
            )}
          </Space>
          <div className={styles.heroValue} style={{ marginTop: 10 }}>
            {currentCrc !== null ? formatCrcHex(currentCrc, model.width) : '—'}
          </div>
          <div className={styles.checkRow}>
            <Text type="secondary">参数自检（"123456789" check）：</Text>
            {selfCheck.ok ? (
              <Tag color="success">通过 {formatCrcHex(selfCheck.computed, model.width)}</Tag>
            ) : (
              <Tag color="error">
                失败：得到 {formatCrcHex(selfCheck.computed, model.width)}，期望 {formatCrcHex(selfCheck.expected, model.width)}
              </Tag>
            )}
          </div>
        </div>
      )}

      {allModelRows.length > 0 && (
        <Card size="small" title="全部 12 个模型同输入对比">
          <div className={styles.tableWrap}>
            <Table
              size="small"
              pagination={false}
              dataSource={allModelRows}
              columns={[
                { title: '模型', dataIndex: 'name', key: 'name' },
                { title: 'width', dataIndex: 'width', key: 'width', width: 80 },
                {
                  title: 'CRC 值',
                  dataIndex: 'value',
                  key: 'value',
                  className: styles.valueCell,
                  render: (value: string) => (
                    <Text code copyable={{ text: value }}>
                      {value}
                    </Text>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        message="计算完全在浏览器本地通过 BigInt 完成，支持 width 1–64 的任意参数模型；Reflected 算法（refIn/refOut）按 Rocksoft™ 参数模型逐位实现，Modbus 等协议线上发送时请注意小端字节序。"
      />
    </div>
  );
}
