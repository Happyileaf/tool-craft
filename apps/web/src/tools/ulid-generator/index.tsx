'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, InputNumber, Radio, Space, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { generateUlidBatch, parseUlid } from './utils/ulid';
import { COUNT_OPTIONS, DEFAULT_COUNT, DEFAULT_SAMPLE_ULID } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

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
 * ULID 生成器与解析器：按 ULID 规范生成 26 字符 Crockford Base32 标识符
 * （10 字符毫秒时间戳 + 16 字符密码学随机段，同毫秒单调递增），支持批量生成、
 * 指定时间戳前缀与反解时间 / 随机段。全部运算在浏览器本地完成，不发起网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，用于解析区初始值
 * @returns ULID 生成与解析交互界面
 */
const UlidGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [count, setCount] = React.useState<number>(DEFAULT_COUNT);
  const [fixedTimestamp, setFixedTimestamp] = React.useState<number | null>(null);
  const [ids, setIds] = React.useState<string[]>([]);
  const [generateError, setGenerateError] = React.useState<string | null>(null);
  const [parseInput, setParseInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE_ULID);

  /**
   * 按当前参数批量生成 ULID
   */
  const regenerate = React.useCallback(() => {
    try {
      setIds(generateUlidBatch(count, fixedTimestamp ?? undefined));
      setGenerateError(null);
    } catch (caught) {
      setIds([]);
      setGenerateError(caught instanceof Error ? caught.message : '生成失败，请检查参数');
    }
  }, [count, fixedTimestamp]);

  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  const parsed = React.useMemo(() => {
    if (!parseInput.trim()) {
      return null;
    }
    try {
      return { result: parseUlid(parseInput), error: null as string | null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [parseInput]);

  /**
   * 复制全部生成结果
   */
  const handleCopyAll = async () => {
    if (ids.length === 0) {
      return;
    }
    await copyToClipboard(ids.join('\n'));
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="ULID 批量生成（Crockford Base32，可按时间字典序排序）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>数量：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              options={COUNT_OPTIONS}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>指定毫秒时间戳：</span>
            <InputNumber
              className={styles.timestampInput}
              placeholder="留空使用当前时间"
              value={fixedTimestamp}
              min={0}
              precision={0}
              onChange={(value) => setFixedTimestamp(value ?? null)}
            />
            <Button type="link" onClick={() => setFixedTimestamp(Date.now())}>
              填入当前时间
            </Button>
            <Button type="link" disabled={fixedTimestamp === null} onClick={() => setFixedTimestamp(null)}>
              清除（用当前时间）
            </Button>
          </div>
          <Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={regenerate}>
              重新生成
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopyAll} disabled={ids.length === 0}>
              复制全部
            </Button>
          </Space>
          {generateError && <Alert type="error" showIcon message="参数有误" description={generateError} />}
          <Input.TextArea
            value={ids.join('\n')}
            readOnly
            autoSize={{ minRows: 6, maxRows: 18 }}
            className={styles.monoOutput}
          />
          <div className={styles.hint}>
            ULID 为 26 字符：前 10 字符是毫秒时间戳（48 位），后 16 字符是 80 位密码学安全随机段
            （Web Crypto getRandomValues）；同一毫秒内连续生成时随机段自动加一，保证结果严格按字典序升序。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title="ULID 解析（反解时间与随机段）">
        <Input.TextArea
          value={parseInput}
          onChange={(event) => setParseInput(event.target.value)}
          placeholder="输入 26 字符 ULID"
          autoSize={{ minRows: 1, maxRows: 4 }}
          spellCheck={false}
          className={styles.monoOutput}
        />
        <div style={{ marginTop: 16 }}>
          {parsed?.error ? (
            <Alert type="error" showIcon message="解析失败" description={parsed.error} />
          ) : parsed?.result ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="毫秒时间戳">{parsed.result.timestamp}</Descriptions.Item>
              <Descriptions.Item label="UTC 时间">
                {new Date(parsed.result.timestamp).toISOString()}
              </Descriptions.Item>
              <Descriptions.Item label="本地时间">
                {formatLocalTime(new Date(parsed.result.timestamp))}
              </Descriptions.Item>
              <Descriptions.Item label="时间戳段（10 字符）">
                <span className={styles.monoText}>{parsed.result.timePart}</span>
              </Descriptions.Item>
              <Descriptions.Item label="随机段（16 字符）">
                <span className={styles.monoText}>{parsed.result.randomPart}</span>
              </Descriptions.Item>
              <Descriptions.Item label="随机段十六进制（80 位）">
                <span className={styles.monoText}>{parsed.result.randomHex}</span>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default UlidGenerator;
