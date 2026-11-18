'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Form, Input, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  convertFrom7Bit,
  convertFrom8Bit,
  parseAddress,
  toHex,
  RESERVED_RANGES,
  DEFAULT_7BIT_INPUT,
} from './utils/i2c';
import { DEVICE_PRESETS, MODE_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * I2C 地址换算器：在 7-bit 从机地址与 8-bit 读 / 写地址之间互转，
 * 并标注 NXP UM10204 定义的保留地址段。全部计算在浏览器本地完成。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const I2cAddressConverter: React.FC<ToolComponentProps> = (_props) => {
  const [mode, setMode] = React.useState<'7to8' | '8to7'>('7to8');
  const [raw, setRaw] = React.useState(DEFAULT_7BIT_INPUT);

  const parsed = React.useMemo(() => parseAddress(raw), [raw]);

  const result = React.useMemo(() => {
    if (parsed === null) {
      return null;
    }
    return mode === '7to8' ? convertFrom7Bit(parsed) : convertFrom8Bit(parsed);
  }, [mode, parsed]);

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  const reservedColumns = [
    { title: '7-bit 起始', dataIndex: 'start', render: (v: number) => `0x${toHex(v)}` },
    { title: '7-bit 结束', dataIndex: 'end', render: (v: number) => `0x${toHex(v)}` },
    { title: '用途', dataIndex: 'purpose' },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">纯浏览器本地计算，地址不会上传，依据 NXP UM10204 I2C 规范</Tag>

          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            options={MODE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />

          <Space wrap>
            {DEVICE_PRESETS.map((device) => (
              <Button
                key={device.address7}
                size="small"
                onClick={() => {
                  setMode('7to8');
                  setRaw(device.address7);
                }}
              >
                {device.name} {device.address7}
              </Button>
            ))}
          </Space>

          <Form.Item
            label={mode === '7to8' ? '7-bit 从机地址（十六进制 0x00–0x77 或十进制）' : '8-bit 地址（十六进制 0x00–0xFF 或十进制）'}
            style={{ marginBottom: 0, maxWidth: 480 }}
          >
            <Input
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              placeholder={mode === '7to8' ? '0x50' : '0xA0'}
              spellCheck={false}
              className={styles.mono}
            />
          </Form.Item>

          {raw.trim() !== '' && parsed === null && (
            <Alert type="error" showIcon message="无法识别的地址，请输入十六进制（0x 或 $ 前缀）或十进制整数" />
          )}

          {result?.errors.map((error) => (
            <Alert key={error} type="error" showIcon message={error} />
          ))}
          {result?.warnings.map((warning) => (
            <Alert key={warning} type="warning" showIcon message={warning} />
          ))}

          {result && result.errors.length === 0 && (
            <div className={styles.resultGrid}>
              <div className={styles.resultCell}>
                <span className={styles.resultLabel}>7-bit 从机地址</span>
                <span className={styles.resultValue}>0x{toHex(result.address7)}</span>
                <span className={styles.hint}>十进制 {result.address7}</span>
              </div>
              <div className={styles.resultCell}>
                <span className={styles.resultLabel}>8-bit 写地址（R/W=0）</span>
                <span className={styles.resultValue}>0x{toHex(result.write8)}</span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(`0x${toHex(result.write8)}`)}>
                  复制
                </Button>
              </div>
              <div className={styles.resultCell}>
                <span className={styles.resultLabel}>8-bit 读地址（R/W=1）</span>
                <span className={styles.resultValue}>0x{toHex(result.read8)}</span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(`0x${toHex(result.read8)}`)}>
                  复制
                </Button>
              </div>
              <div className={styles.resultCell}>
                <span className={styles.resultLabel}>保留地址</span>
                <span className={styles.resultValue}>{result.isReserved ? '是' : '否'}</span>
                {result.reservedPurpose && <span className={styles.hint}>{result.reservedPurpose}</span>}
              </div>
            </div>
          )}

          <Card type="inner" title="I2C 保留地址段（7-bit 视角，UM10204 Table 4）" size="small">
            <Table
              size="small"
              rowKey={(record) => `${record.start}-${record.end}`}
              columns={reservedColumns}
              dataSource={[...RESERVED_RANGES]}
              pagination={false}
            />
            <p className={styles.hint} style={{ marginTop: 8 }}>
              换算关系：8-bit 写地址 = (7-bit 地址) ≪ 1；8-bit 读地址 = 写地址 | 0x01。数据手册通常标注 7-bit 地址，
              而逻辑分析仪与 Linux i2c-tools 部分场景使用 8-bit 地址，二者相差一个最低位。
            </p>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default I2cAddressConverter;
