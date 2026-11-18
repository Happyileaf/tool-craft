'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Descriptions, Input, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { DEFAULT_INPUT, INPUT_HINT, RESERVED_HINT } from './constants';
import { convertI2cAddress, type AddressView } from './utils/i2c';
import styles from './index.module.css';

const VIEW_COLUMNS: Array<{ title: string; key: keyof AddressView }> = [
  { title: 'HEX', key: 'hex' },
  { title: 'DEC', key: 'dec' },
  { title: 'BIN', key: 'bin' },
];

/**
 * I2C 地址换算器：在 7-bit 地址与 8-bit 读 / 写地址之间双向换算，
 * 输出 HEX/DEC/BIN 三种进制并标注 UM10204 保留区间，全部计算在浏览器本地完成。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const I2cAddressCalculator: React.FC<ToolComponentProps> = (_props) => {
  const [raw, setRaw] = React.useState(DEFAULT_INPUT);
  const result = React.useMemo(() => convertI2cAddress(raw), [raw]);

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  const tableData = [
    { key: 'seven', label: '7-bit 从机地址', view: result.sevenBit },
    { key: 'write', label: '8-bit 写地址（addr<<1 | 0）', view: result.writeAddress },
    { key: 'read', label: '8-bit 读地址（addr<<1 | 1）', view: result.readAddress },
  ].filter((row) => row.view !== null);

  const columns = [
    { title: '地址类型', dataIndex: 'label', width: 240 },
    ...VIEW_COLUMNS.map((col) => ({
      title: col.title,
      render: (_: unknown, row: (typeof tableData)[number]) => (
        <Space>
          <span className={styles.codeOutput}>{row.view?.[col.key]}</span>
          <button
            type="button"
            className="ant-btn ant-btn-sm ant-btn-text"
            onClick={() => row.view && handleCopy(row.view[col.key], col.title)}
            aria-label={`复制${col.title}`}
          >
            <CopyOutlined />
          </button>
        </Space>
      ),
    })),
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">纯浏览器本地计算，地址不上传；依据 NXP UM10204 I2C 规范</Tag>
          <Input
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            placeholder="输入 I2C 地址，如 0x50 / 80 / 0b1010000 / 0xA0"
            spellCheck={false}
            className={styles.mono}
            size="large"
          />
          <Alert type="info" showIcon message={INPUT_HINT} />

          {result.errors.map((error) => (
            <Alert
              key={error}
              type={error.includes('读地址') ? 'warning' : 'error'}
              showIcon
              message={error}
            />
          ))}

          {result.reserved && (
            <Alert
              type="warning"
              showIcon
              message={
                result.generalCall
                  ? '该地址为保留地址：0x00 是通用呼叫（General Call）地址，不能分配给普通从设备'
                  : '该 7-bit 地址落在 UM10204 保留区间，不能分配给普通从设备'
              }
              description={RESERVED_HINT}
            />
          )}

          {result.interpretedAs && (
            <Alert
              type="success"
              showIcon
              message={
                result.interpretedAs === '7bit'
                  ? '输入按 7-bit 从机地址解释，已左移生成 8-bit 读 / 写地址'
                  : '输入按 8-bit 读 / 写字节解释，已右移还原 7-bit 从机地址'
              }
            />
          )}

          {result.sevenBit && (
            <Card size="small" title="换算结果">
              <Table
                size="small"
                rowKey="key"
                columns={columns}
                dataSource={tableData}
                pagination={false}
              />
            </Card>
          )}

          {result.sevenBit && (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="位运算说明">
                <span className={styles.mono}>
                  write = (7bit &lt;&lt; 1) &amp; 0xFF；read = write | 0x01；反向：7bit = 8bit &gt;&gt; 1
                </span>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default I2cAddressCalculator;
