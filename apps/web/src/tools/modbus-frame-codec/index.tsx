'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  buildModbusFrame,
  parseModbusFrame,
  type ModbusBuildConfig,
  type ModbusField,
  type ModbusMode,
} from './utils/modbus';
import {
  DEFAULT_BUILD_DATA,
  DEFAULT_RTU_HEX,
  DEFAULT_TCP_HEX,
  FUNCTION_PRESETS,
  MODBUS_PLACEHOLDER,
} from './constants';
import styles from './index.module.css';

const fieldColumns = [
  { title: '字段', dataIndex: 'label', width: 160 },
  { title: '值', dataIndex: 'value' },
];

const hex16 = (value: number): string => `0x${value.toString(16).padStart(4, '0').toUpperCase()}`;

/**
 * Modbus RTU / TCP 报文解析与构造工具，CRC 校验与 MBAP 处理均在浏览器本地完成
 */
const ModbusFrameCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_RTU_HEX);

  const parsed = React.useMemo(() => {
    try {
      return { frame: parseModbusFrame(hexInput), error: null as string | null };
    } catch (caught) {
      return { frame: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput]);

  const [buildConfig, setBuildConfig] = React.useState<ModbusBuildConfig>({
    mode: 'rtu',
    unitId: 1,
    functionCode: 0x03,
    dataHex: DEFAULT_BUILD_DATA,
    transactionId: 1,
  });

  const updateConfig = <K extends keyof ModbusBuildConfig>(
    key: K,
    value: ModbusBuildConfig[K],
  ): void => {
    setBuildConfig((previous) => ({ ...previous, [key]: value }));
  };

  const built = React.useMemo(() => {
    try {
      return { output: buildModbusFrame(buildConfig), error: null as string | null };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '构造失败' };
    }
  }, [buildConfig]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const frame = parsed.frame;

  return (
    <div className={styles.container}>
      <Card title="Modbus 报文解析与 CRC 校验">
        <span className={styles.label}>报文十六进制（RTU 或 TCP）</span>
        <Input.TextArea
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          rows={4}
          className={styles.inputArea}
          placeholder={MODBUS_PLACEHOLDER}
        />
        <Space wrap style={{ margin: '10px 0' }}>
          <Button icon={<ReloadOutlined />} onClick={() => setHexInput(DEFAULT_RTU_HEX)}>
            载入 RTU 示例
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => setHexInput(DEFAULT_TCP_HEX)}>
            载入 TCP 示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setHexInput('')}>
            清空
          </Button>
        </Space>

        {parsed.error ? (
          <Alert type="error" showIcon message="解析失败" description={parsed.error} />
        ) : (
          frame && (
            <div className={styles.resultCard}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="报文模式">
                  <Tag color={frame.mode === 'tcp' ? 'blue' : 'green'}>
                    {frame.mode === 'tcp' ? 'Modbus TCP' : 'Modbus RTU'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={frame.mode === 'tcp' ? '单元 ID' : '从站地址'}>
                  {frame.unitId}
                </Descriptions.Item>
                <Descriptions.Item label="功能码" span={2}>
                  <Space wrap>
                    <span>
                      0x{frame.functionCode.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                    <span>{frame.functionName}</span>
                    {frame.isException && <Tag color="red">异常响应</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="报文长度">{frame.byteLength} 字节</Descriptions.Item>
                <Descriptions.Item label="PDU 数据长度">{frame.data.length} 字节</Descriptions.Item>

                {frame.mode === 'rtu' ? (
                  <>
                    <Descriptions.Item label="CRC 接收值">
                      {frame.crcReceived === null ? '—' : hex16(frame.crcReceived)}
                    </Descriptions.Item>
                    <Descriptions.Item label="CRC 校验">
                      <Space>
                        <span>{frame.crc === null ? '—' : hex16(frame.crc)}</span>
                        {frame.crcValid ? <Tag color="green">通过</Tag> : <Tag color="red">失败</Tag>}
                      </Space>
                    </Descriptions.Item>
                  </>
                ) : (
                  <>
                    <Descriptions.Item label="事务 ID">
                      {frame.transactionId === null ? '—' : frame.transactionId}
                    </Descriptions.Item>
                    <Descriptions.Item label="协议 ID">
                      {frame.protocolId === null ? '—' : frame.protocolId}
                    </Descriptions.Item>
                    <Descriptions.Item label="MBAP 长度">
                      {frame.mbapLength === null ? '—' : `${frame.mbapLength} 字节`}
                    </Descriptions.Item>
                    <Descriptions.Item label="协议 ID 校验">
                      {frame.protocolId === 0 ? (
                        <Tag color="green">协议 ID 为 0</Tag>
                      ) : (
                        <Tag color="red">协议 ID 非 0</Tag>
                      )}
                    </Descriptions.Item>
                  </>
                )}

                {frame.exceptionCode !== null && (
                  <Descriptions.Item label="异常码" span={2}>
                    {frame.exceptionCode} · {frame.exceptionName}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {frame.fields.length > 0 && (
                <div>
                  <span className={styles.label}>PDU 字段解读</span>
                  <Table<ModbusField>
                    size="small"
                    rowKey="label"
                    pagination={false}
                    columns={fieldColumns}
                    dataSource={frame.fields}
                  />
                </div>
              )}

              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>PDU 数据（功能码之后）</span>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(frame.dataHex)}>
                    复制
                  </Button>
                </div>
                <code className={styles.hexText}>{frame.dataHex || '（无数据）'}</code>
              </div>
            </div>
          )
        )}
      </Card>

      <Card title="Modbus 报文构造器（RTU 自动补 CRC / TCP 自动写 MBAP）">
        <div className={styles.fieldRow}>
          <div>
            <span className={styles.label}>模式</span>
            <Select<ModbusMode>
              value={buildConfig.mode}
              onChange={(value) => updateConfig('mode', value)}
              style={{ width: 150 }}
              options={[
                { value: 'rtu', label: 'Modbus RTU' },
                { value: 'tcp', label: 'Modbus TCP' },
              ]}
            />
          </div>
          <div>
            <span className={styles.label}>
              {buildConfig.mode === 'tcp' ? '单元 ID' : '从站地址'}
            </span>
            <InputNumber
              min={0}
              max={255}
              value={buildConfig.unitId}
              onChange={(value) => updateConfig('unitId', value ?? 0)}
              style={{ width: 110 }}
            />
          </div>
          <div>
            <span className={styles.label}>功能码</span>
            <Select
              value={buildConfig.functionCode}
              onChange={(value) => updateConfig('functionCode', value)}
              style={{ width: 280 }}
              options={FUNCTION_PRESETS}
            />
          </div>
          {buildConfig.mode === 'tcp' && (
            <div>
              <span className={styles.label}>事务 ID</span>
              <InputNumber
                min={0}
                max={65535}
                value={buildConfig.transactionId}
                onChange={(value) => updateConfig('transactionId', value ?? 0)}
                style={{ width: 130 }}
              />
            </div>
          )}
        </div>

        <span className={styles.label} style={{ marginTop: 12 }}>
          PDU 数据十六进制（功能码之后，RTU 不要包含 CRC）
        </span>
        <Input
          value={buildConfig.dataHex}
          onChange={(event) => updateConfig('dataHex', event.target.value)}
          className={styles.monoInput}
          placeholder="例如 00 00 00 0A 表示起始地址 0、读取 10 个寄存器"
        />

        {built.error ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="构造失败" description={built.error} />
        ) : (
          built.output && (
            <div className={styles.hexBlock} style={{ marginTop: 12 }}>
              <div className={styles.hexHeader}>
                <span>
                  报文 {built.output.bytes.length} 字节
                  {built.output.crc !== null && `，CRC ${hex16(built.output.crc)}`}
                  {built.output.mbapLength !== null && `，MBAP 长度 ${built.output.mbapLength}`}
                </span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(built.output!.hex)}>
                  复制
                </Button>
              </div>
              <code className={styles.hexText}>{built.output.hex}</code>
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="Modbus 报文结构说明"
        description={
          <div className={styles.hint}>
            <p>
              Modbus RTU 帧由从站地址、功能码、数据与 2 字节 CRC16 组成。CRC 采用反射多项式
              0xA001、初值 0xFFFF，传输时低字节在前（例如 CRC 值 0xCDC5 线上写作 C5 CD）。
            </p>
            <p>
              Modbus TCP 使用 7 字节 MBAP 头：事务 ID（2）、协议 ID（2，固定为 0）、长度（2，
              表示其后单元 ID + PDU 的字节数）、单元 ID（1），之后紧跟功能码与数据。异常响应会把
              功能码最高位置 1，并在数据区首字节给出异常码。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default ModbusFrameCodec;
