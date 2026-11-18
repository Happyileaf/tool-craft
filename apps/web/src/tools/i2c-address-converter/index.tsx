'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tabs, Tag, message } from 'antd';
import { EXAMPLE_7BIT, EXAMPLE_8BIT } from './constants';
import {
  RESERVED_RANGES,
  convert7To8,
  convert8To7,
  type RadixViews,
} from './utils/i2c';
import styles from './index.module.css';

/** 三进制视图网格 */
function RadixGrid({ views }: { views: RadixViews }) {
  return (
    <div className={styles.radixGrid}>
      <div className={styles.radixCell}>
        <div className={styles.radixLabel}>HEX</div>
        <div className={styles.radixValue}>{views.hex}</div>
      </div>
      <div className={styles.radixCell}>
        <div className={styles.radixLabel}>DEC</div>
        <div className={styles.radixValue}>{views.dec}</div>
      </div>
      <div className={styles.radixCell}>
        <div className={styles.radixLabel}>BIN</div>
        <div className={styles.radixValue}>{views.bin}</div>
      </div>
    </div>
  );
}

/**
 * I2C 地址换算器：在 7-bit 设备地址与总线实际发送的 8-bit 读/写字节之间
 * 双向换算（UM10204 §2.1.2），并标注保留地址区间。全部计算在本地同步完成。
 *
 * @returns 正向 / 反向双模式界面
 */
const I2cAddressConverter: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<'forward' | 'reverse'>('forward');
  const [address7Input, setAddress7Input] = React.useState(EXAMPLE_7BIT);
  const [byteInput, setByteInput] = React.useState('');

  const copyText = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label}已复制`))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  // 正向模式：同步计算，异常时渲染错误提示
  const forward = React.useMemo(() => {
    if (address7Input.trim() === '') {
      return { error: '请填写 7-bit I2C 地址' };
    }
    try {
      return { data: convert7To8(address7Input) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [address7Input]);

  const reverse = React.useMemo(() => {
    if (byteInput.trim() === '') {
      return { empty: true };
    }
    try {
      return { data: convert8To7(byteInput) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [byteInput]);

  const forwardTab = (
    <div>
      <p className={styles.hint}>
        输入 7-bit 设备地址（支持 0x50、50h、0b1010000、80 等写法），工具按
        写字节 = 地址左移一位 | 0、读字节 = 地址左移一位 | 1 派生总线字节，并对保留区间给出警告。
      </p>
      <div className={styles.fieldLabel}>7-bit I2C 地址</div>
      <Input
        value={address7Input}
        onChange={(event) => setAddress7Input(event.target.value)}
        placeholder="例如 0x50"
        allowClear
      />
      <Space wrap style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => setAddress7Input(EXAMPLE_7BIT)}>
          填入示例（EEPROM 0x50）
        </Button>
        <Button size="small" onClick={() => setAddress7Input('0x00')}>
          General Call（0x00）
        </Button>
      </Space>

      {forward.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={forward.error} />
      ) : null}

      {forward.data ? (
        <div className={styles.resultStack}>
          {forward.data.reserved ? (
            <Alert type="warning" showIcon message="保留地址，不可分配给普通从设备" description={forward.data.reservedReason} />
          ) : (
            <Alert type="success" showIcon message="普通可用从设备地址" />
          )}
          <div className={styles.resultBlock}>
            <div className={styles.resultName}>7-bit 地址</div>
            <RadixGrid views={forward.data.views7} />
          </div>
          <div className={styles.resultBlock}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <div className={styles.resultName}>8-bit 写地址（最低位 R/W = 0）</div>
              <Button size="small" onClick={() => copyText(forward.data!.writeViews.hex, '写地址')}>
                复制 HEX
              </Button>
            </Space>
            <RadixGrid views={forward.data.writeViews} />
          </div>
          <div className={styles.resultBlock}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <div className={styles.resultName}>8-bit 读地址（最低位 R/W = 1）</div>
              <Button size="small" onClick={() => copyText(forward.data!.readViews.hex, '读地址')}>
                复制 HEX
              </Button>
            </Space>
            <RadixGrid views={forward.data.readViews} />
          </div>
        </div>
      ) : null}
    </div>
  );

  const reverseTab = (
    <div>
      <p className={styles.hint}>
        粘贴数据手册或 HAL 库给出的 8-bit 发送字节，自动右移一位还原 7-bit 地址，并根据最低位识别读 / 写方向。
      </p>
      <div className={styles.fieldLabel}>8-bit 地址字节（读或写均可）</div>
      <Input
        value={byteInput}
        onChange={(event) => setByteInput(event.target.value)}
        placeholder="例如 0xA0（写）或 0xA1（读）"
        allowClear
      />
      <Space wrap style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => setByteInput(EXAMPLE_8BIT)}>
          填入示例（0xA0）
        </Button>
        <Button size="small" onClick={() => setByteInput('')}>
          清空
        </Button>
      </Space>

      {reverse.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={reverse.error} />
      ) : null}

      {reverse.data ? (
        <div className={styles.resultStack}>
          <Space wrap>
            <Tag color={reverse.data.direction === 'write' ? 'blue' : 'green'}>
              方向位：{reverse.data.direction === 'write' ? '写（R/W = 0）' : '读（R/W = 1）'}
            </Tag>
            <Tag>输入字节：0x{reverse.data.byte.toString(16).toUpperCase().padStart(2, '0')}</Tag>
          </Space>
          {reverse.data.reserved ? (
            <Alert type="warning" showIcon message="还原地址落在保留区间" description={reverse.data.reservedReason} />
          ) : null}
          <div className={styles.resultBlock}>
            <div className={styles.resultName}>还原的 7-bit 地址（字节右移一位）</div>
            <RadixGrid views={reverse.data.views7} />
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card
        title="I2C 地址换算器（7-bit ↔ 8-bit 读写地址，UM10204）"
        extra={
          <Radio.Group
            size="small"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            options={[
              { label: '7-bit → 8-bit', value: 'forward' },
              { label: '8-bit → 7-bit', value: 'reverse' },
            ]}
            optionType="button"
            buttonStyle="solid"
          />
        }
      >
        <Tabs
          activeKey={mode}
          onTabClick={(key) => setMode(key as 'forward' | 'reverse')}
          items={[
            { key: 'forward', label: '7-bit → 8-bit', children: forwardTab },
            { key: 'reverse', label: '8-bit → 7-bit', children: reverseTab },
          ]}
        />
        <Table
          size="small"
          style={{ marginTop: 24 }}
          pagination={false}
          rowKey="from"
          dataSource={RESERVED_RANGES.map((range) => ({
            ...range,
            span: `0x${range.from.toString(16).toUpperCase().padStart(2, '0')} – 0x${range.to
              .toString(16)
              .toUpperCase()
              .padStart(2, '0')}`,
          }))}
          columns={[
            { title: '保留区间（7-bit）', dataIndex: 'span', key: 'span' },
            { title: '说明', dataIndex: 'reason', key: 'reason' },
          ]}
        />
      </Card>
    </div>
  );
};

export default I2cAddressConverter;
