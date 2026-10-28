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
  Space,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  parseObjectId,
  generateObjectId,
  generateObjectIdBatch,
  type ObjectIdParts,
} from './utils/objectid';
import { DEFAULT_BATCH_COUNT, DEFAULT_OBJECT_ID, MAX_BATCH_COUNT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 把 Date 格式化为本地时区的 yyyy-MM-dd HH:mm:ss */
function formatLocalTime(date: Date): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

interface ParsedState {
  result: ObjectIdParts | null;
  error: string | null;
}

/**
 * MongoDB ObjectId 解析与生成：
 * 上半区把 24 位十六进制 ObjectId 拆解为时间戳 / 随机值（机器+进程）/ 计数器；
 * 下半区用 Web Crypto 生成单个或批量 ObjectId，支持自定义秒级时间戳。
 * 全部运算在浏览器本地完成，不访问任何数据库。
 */
const MongodbObjectId: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [objectId, setObjectId] = React.useState<string>(defaultInput || DEFAULT_OBJECT_ID);

  const [useCustomTime, setUseCustomTime] = React.useState<boolean>(false);
  const [customSeconds, setCustomSeconds] = React.useState<number>(
    Math.floor(Date.now() / 1000),
  );
  const [batchCount, setBatchCount] = React.useState<number>(DEFAULT_BATCH_COUNT);
  const [single, setSingle] = React.useState<string>('');
  const [batch, setBatch] = React.useState<string>('');
  const [genError, setGenError] = React.useState<string | null>(null);

  const parsed = React.useMemo<ParsedState>(() => {
    if (!objectId.trim()) {
      return { result: null, error: null };
    }
    try {
      return { result: parseObjectId(objectId), error: null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [objectId]);

  const activeSeconds = useCustomTime ? customSeconds : undefined;

  const handleGenerateSingle = () => {
    try {
      setSingle(generateObjectId({ timestampSeconds: activeSeconds }));
      setGenError(null);
    } catch (caught) {
      setSingle('');
      setGenError(caught instanceof Error ? caught.message : '生成失败');
    }
  };

  const handleGenerateBatch = () => {
    try {
      setBatch(generateObjectIdBatch(batchCount, activeSeconds).join('\n'));
      setGenError(null);
    } catch (caught) {
      setBatch('');
      setGenError(caught instanceof Error ? caught.message : '生成失败');
    }
  };

  const handleCopy = async (value: string, label: string) => {
    if (!value) {
      return;
    }
    await copyToClipboard(value);
    message.success(`${label}已复制`);
  };

  // 首次渲染即生成一个样例，便于直接查看（仅挂载时执行一次）
  React.useEffect(() => {
    handleGenerateSingle();
  }, []);

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="解析 ObjectId（12 字节布局拆解）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={objectId}
            onChange={(event) => setObjectId(event.target.value.trim())}
            placeholder="输入 24 位十六进制 ObjectId，如 507f1f77bcf86cd799439011"
            spellCheck={false}
            className={styles.monoOutput}
          />
          <div className={styles.hint}>
            布局（大端）：前 4 字节 Unix 秒级时间戳 ＋ 5 字节随机值（传统驱动为 3 字节机器标识 ＋ 2
            字节进程标识）＋ 3 字节自增计数器。
          </div>
          {parsed.error ? (
            <Alert type="error" showIcon message="解析失败" description={parsed.error} />
          ) : parsed.result ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="创建时间（本地）">
                {formatLocalTime(new Date(parsed.result.timestampMs))}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间（UTC）">
                {new Date(parsed.result.timestampMs).toISOString()}
              </Descriptions.Item>
              <Descriptions.Item label="Unix 秒级时间戳">
                {parsed.result.timestampSeconds}
              </Descriptions.Item>
              <Descriptions.Item label="随机值（5 字节）">
                <span className={styles.monoText}>{parsed.result.randomHex}</span>
                <span className={styles.hint}>
                  {' '}
                  （机器 <span className={styles.monoText}>{parsed.result.machineHex}</span> ／进程{' '}
                  {parsed.result.processId}）
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="计数器（3 字节，0–16777215）">
                {parsed.result.counter}
                <span className={styles.hint}> （0x{parsed.result.counter.toString(16)}）</span>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Space>
      </Card>

      <Card className={styles.card} title="生成 ObjectId（Web Crypto 安全随机源）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>时间戳：</span>
            <Tag
              color={useCustomTime ? 'default' : 'blue'}
              style={{ cursor: 'pointer' }}
              onClick={() => setUseCustomTime(false)}
            >
              当前时间
            </Tag>
            <Tag
              color={useCustomTime ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setUseCustomTime(true)}
            >
              自定义秒级时间戳
            </Tag>
            {useCustomTime && (
              <>
                <InputNumber
                  className={styles.numberInput}
                  value={customSeconds}
                  min={0}
                  max={0xffffffff}
                  precision={0}
                  onChange={(value) => setCustomSeconds(value ?? 0)}
                />
                <Button size="small" onClick={() => setCustomSeconds(Math.floor(Date.now() / 1000))}>
                  填入当前秒
                </Button>
              </>
            )}
          </div>

          <Space wrap>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerateSingle}>
              生成 1 个
            </Button>
            <Button icon={<CopyOutlined />} disabled={!single} onClick={() => handleCopy(single, '结果')}>
              复制
            </Button>
            {single ? <span className={styles.monoText}>{single}</span> : null}
          </Space>

          <div className={styles.field}>
            <span className={styles.label}>批量数量：</span>
            <InputNumber
              className={styles.smallInput}
              value={batchCount}
              min={1}
              max={MAX_BATCH_COUNT}
              precision={0}
              onChange={(value) => setBatchCount(value ?? DEFAULT_BATCH_COUNT)}
            />
            <Button onClick={handleGenerateBatch}>批量生成</Button>
            <Button icon={<CopyOutlined />} disabled={!batch} onClick={() => handleCopy(batch, '批量结果')}>
              复制全部
            </Button>
            <span className={styles.hint}>同批共享时间戳与随机值，计数器连续递增。</span>
          </div>
          {batch ? (
            <Input.TextArea
              value={batch}
              readOnly
              spellCheck={false}
              className={styles.batchOutput}
              autoSize={{ minRows: 3, maxRows: 14 }}
            />
          ) : null}

          {genError ? (
            <Alert type="error" showIcon message="生成失败" description={genError} />
          ) : null}
        </Space>
      </Card>
    </div>
  );
};

export default MongodbObjectId;
