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
  Space,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  DISCORD_EPOCH,
  SNOWFLAKE_PRESETS,
  TWITTER_EPOCH,
  buildSnowflake,
  decomposeSnowflake,
} from './utils/snowflake';
import { DEFAULT_EPOCH_KEY, DEFAULT_SNOWFLAKE_ID, EPOCH_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const EPOCH_MAP: Record<string, bigint> = {
  twitter: TWITTER_EPOCH,
  discord: DISCORD_EPOCH,
};

/**
 * 把 Date 格式化为本地时区的 yyyy-MM-dd HH:mm:ss.SSS
 *
 * @param date - 日期对象
 * @returns 本地时间字符串
 */
function formatLocalTime(date: Date): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
      date.getMilliseconds(),
      3,
    )}`
  );
}

/**
 * Snowflake ID 解析器：按「纪元 + 41 位毫秒时间戳 + 10 位机器位 + 12 位序列号」
 * 位布局拆解 64 位 Snowflake ID，内置 Twitter/X 与 Discord 纪元并支持自定义纪元，
 * 同时支持按时间戳 / 机器位 / 序列号反向拼装示例 ID。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，作为解析区初始 ID
 * @returns Snowflake 解析与拼装交互界面
 */
const SnowflakeIdParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [snowflakeId, setSnowflakeId] = React.useState<string>(
    defaultInput || DEFAULT_SNOWFLAKE_ID,
  );
  const [epochKey, setEpochKey] = React.useState<string>(DEFAULT_EPOCH_KEY);
  const [customEpoch, setCustomEpoch] = React.useState<number | null>(null);

  const [buildTimestamp, setBuildTimestamp] = React.useState<number>(Date.now());
  const [machineId, setMachineId] = React.useState<number>(0);
  const [sequence, setSequence] = React.useState<number>(0);
  const [builtId, setBuiltId] = React.useState<string | null>(null);
  const [buildError, setBuildError] = React.useState<string | null>(null);

  const activeEpoch = React.useMemo(() => {
    if (epochKey === 'custom') {
      return customEpoch !== null && Number.isSafeInteger(customEpoch) && customEpoch >= 0
        ? BigInt(customEpoch)
        : null;
    }
    return EPOCH_MAP[epochKey] ?? DISCORD_EPOCH;
  }, [epochKey, customEpoch]);

  const parsed = React.useMemo(() => {
    if (!snowflakeId.trim()) {
      return null;
    }
    if (activeEpoch === null) {
      return { result: null, error: '请输入合法的自定义纪元毫秒值' };
    }
    try {
      return { result: decomposeSnowflake(snowflakeId, activeEpoch), error: null as string | null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [snowflakeId, activeEpoch]);

  /**
   * 按当前时间戳 / 机器位 / 序列号拼装 Snowflake ID
   */
  const handleBuild = () => {
    if (activeEpoch === null) {
      setBuiltId(null);
      setBuildError('请输入合法的自定义纪元毫秒值');
      return;
    }
    try {
      const id = buildSnowflake({ timestamp: buildTimestamp, machineId, sequence }, activeEpoch);
      setBuiltId(id);
      setBuildError(null);
    } catch (caught) {
      setBuiltId(null);
      setBuildError(caught instanceof Error ? caught.message : '拼装失败，请检查参数');
    }
  };

  /**
   * 复制拼装结果
   */
  const handleCopy = async () => {
    if (!builtId) {
      return;
    }
    await copyToClipboard(builtId);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="Snowflake ID 解析（位拆解 + 纪元换算）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            value={snowflakeId}
            onChange={(event) => setSnowflakeId(event.target.value.trim())}
            placeholder="输入 Snowflake ID（十进制，如 175928847299117063）"
            autoSize={{ minRows: 1, maxRows: 3 }}
            spellCheck={false}
            className={styles.monoOutput}
          />
          <div className={styles.field}>
            <span className={styles.label}>纪元：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={epochKey}
              onChange={(event) => setEpochKey(event.target.value)}
              options={EPOCH_OPTIONS}
            />
          </div>
          {epochKey === 'custom' && (
            <div className={styles.field}>
              <span className={styles.label}>自定义纪元（毫秒）：</span>
              <InputNumber
                className={styles.numberInput}
                placeholder="如 1288834974657"
                value={customEpoch}
                min={0}
                precision={0}
                onChange={(value) => setCustomEpoch(value ?? null)}
              />
            </div>
          )}
          {activeEpoch !== null && (
            <div className={styles.hint}>
              当前纪元：{SNOWFLAKE_PRESETS.find((preset) => preset.epoch === activeEpoch)?.label ?? '自定义'}
              （{activeEpoch.toString()}）；位布局：1 bit 保留 + 41 bit 相对毫秒时间戳 + 10 bit
              机器位（Discord 为 5 bit worker + 5 bit process）+ 12 bit 序列号。
            </div>
          )}
          {parsed?.error ? (
            <Alert type="error" showIcon message="解析失败" description={parsed.error} />
          ) : parsed?.result ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="创建时间（本地）">
                {formatLocalTime(new Date(parsed.result.timestamp))}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间（UTC）">
                {new Date(parsed.result.timestamp).toISOString()}
              </Descriptions.Item>
              <Descriptions.Item label="毫秒时间戳">{parsed.result.timestamp}</Descriptions.Item>
              <Descriptions.Item label="相对纪元毫秒">{parsed.result.relativeTimestamp}</Descriptions.Item>
              <Descriptions.Item label="机器 ID（10 bit，0–1023）">
                {parsed.result.machineId}（worker {parsed.result.workerId} / process{' '}
                {parsed.result.processId}）
              </Descriptions.Item>
              <Descriptions.Item label="序列号（12 bit，0–4095）">
                {parsed.result.sequence}
              </Descriptions.Item>
              <Descriptions.Item label="十六进制">
                <span className={styles.monoText}>{parsed.result.idHex}</span>
              </Descriptions.Item>
              <Descriptions.Item label="二进制（64 bit）">
                <span className={styles.binaryText}>{parsed.result.idBinary}</span>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Space>
      </Card>

      <Card className={styles.card} title="反向拼装示例 Snowflake ID">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>毫秒时间戳：</span>
            <InputNumber
              className={styles.numberInput}
              value={buildTimestamp}
              min={0}
              precision={0}
              onChange={(value) => setBuildTimestamp(value ?? 0)}
            />
            <Button type="link" onClick={() => setBuildTimestamp(Date.now())}>
              填入当前时间
            </Button>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>机器 ID（0–1023）：</span>
            <InputNumber
              className={styles.smallInput}
              value={machineId}
              min={0}
              max={1023}
              precision={0}
              onChange={(value) => setMachineId(value ?? 0)}
            />
            <span className={styles.label} style={{ marginLeft: 24 }}>
              序列号（0–4095）：
            </span>
            <InputNumber
              className={styles.smallInput}
              value={sequence}
              min={0}
              max={4095}
              precision={0}
              onChange={(value) => setSequence(value ?? 0)}
            />
          </div>
          <Space>
            <Button type="primary" onClick={handleBuild}>
              拼装 ID
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!builtId}>
              复制结果
            </Button>
          </Space>
          {buildError && <Alert type="error" showIcon message="拼装失败" description={buildError} />}
          {builtId && (
            <Input.TextArea
              value={builtId}
              readOnly
              autoSize={{ minRows: 1, maxRows: 3 }}
              className={styles.monoOutput}
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default SnowflakeIdParser;
