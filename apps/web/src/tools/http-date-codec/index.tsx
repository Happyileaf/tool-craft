'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { SAMPLE_HTTP_DATES } from './constants';
import { formatImfFixdate, parseHttpDate } from './utils/httpDate';
import styles from './index.module.css';

type Mode = 'parse' | 'build';

/**
 * HTTP 日期头解析与格式化器（RFC 9110 §5.6.7）。
 * 解析 IMF-fixdate / RFC 850 / asctime 三种历史格式为 epoch 秒；
 * 构造方向把 epoch 秒统一格式化为首选 IMF-fixdate，全部按 UTC 处理。
 */
const HttpDateCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('parse');
  const [dateInput, setDateInput] = React.useState<string>(
    defaultInput ?? SAMPLE_HTTP_DATES[0] ?? '',
  );
  const [epochInput, setEpochInput] = React.useState<string>('784111777');

  const parsed = React.useMemo(() => parseHttpDate(dateInput), [dateInput]);

  const built = React.useMemo(() => {
    const trimmed = epochInput.trim();
    if (!trimmed) {
      return { ok: false as const, text: '', error: '输入为空' };
    }
    const epoch = Number(trimmed);
    if (!Number.isFinite(epoch) || !Number.isInteger(epoch)) {
      return { ok: false as const, text: '', error: '请输入整数 epoch 秒' };
    }
    try {
      return { ok: true as const, text: formatImfFixdate(epoch), error: undefined };
    } catch (error) {
      return { ok: false as const, text: '', error: (error as Error).message };
    }
  }, [epochInput]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={[
          { label: '解析 HTTP-date → epoch', value: 'parse' },
          { label: '构造 epoch → IMF-fixdate', value: 'build' },
        ]}
      />

      {mode === 'parse' ? (
        <Card
          title="解析 HTTP 日期头"
          extra={
            <Button size="small" onClick={() => setDateInput(SAMPLE_HTTP_DATES[0] ?? '')}>
              示例
            </Button>
          }
        >
          <Input
            className={styles.mono}
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            placeholder="Sun, 06 Nov 1994 08:49:37 GMT"
          />
          <div className={styles.samples}>
            {SAMPLE_HTTP_DATES.map((sample) => (
              <Tag
                key={sample}
                className={styles.mono}
                onClick={() => sample !== undefined && setDateInput(sample)}
              >
                {sample}
              </Tag>
            ))}
          </div>

          {parsed.ok ? (
            <Card type="inner" title="解析结果（UTC）" style={{ marginTop: 12 }}>
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={styles.row}>
                  <dt>识别格式</dt>
                  <dd>
                    <Tag color="blue">{parsed.format}</Tag>
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt>epoch 秒</dt>
                  <dd className={styles.mono}>{parsed.epochSeconds}</dd>
                </div>
                <div className={styles.row}>
                  <dt>ISO 8601</dt>
                  <dd className={styles.mono}>{parsed.iso}</dd>
                </div>
                <div className={styles.row}>
                  <dt>归一 IMF</dt>
                  <dd className={styles.mono}>{formatImfFixdate(parsed.epochSeconds)}</dd>
                </div>
              </dl>
              <Button
                size="small"
                icon={<CopyOutlined />}
                style={{ marginTop: 8 }}
                onClick={() => handleCopy(String(parsed.epochSeconds))}
              >
                复制 epoch 秒
              </Button>
            </Card>
          ) : (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message="解析失败"
              description={parsed.error}
            />
          )}
        </Card>
      ) : (
        <Card title="构造 IMF-fixdate">
          <Input
            className={styles.mono}
            value={epochInput}
            onChange={(event) => setEpochInput(event.target.value)}
            placeholder="输入 Unix epoch 秒，例如 784111777"
          />
          {built.ok ? (
            <>
              <div className={`${styles.resultBox} ${styles.mono}`} style={{ marginTop: 12 }}>
                {built.text}
              </div>
              <Button
                size="small"
                type="primary"
                icon={<CopyOutlined />}
                style={{ marginTop: 8 }}
                onClick={() => handleCopy(built.text)}
              >
                复制 IMF-fixdate
              </Button>
            </>
          ) : (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message="构造失败"
              description={built.error}
            />
          )}
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        message="HTTP-date 速记（RFC 9110 §5.6.7）"
        description={
          <div className={styles.hint}>
            <p>
              接收三种历史格式：首选
              <span className={styles.mono}> IMF-fixdate </span>
              （Sun, 06 Nov 1994 08:49:37 GMT）、过时的
              <span className={styles.mono}> RFC 850 </span>
              （两位年份，按世纪规则推断）与
              <span className={styles.mono}> asctime </span>
              （单日号前为两个空格）；发送时统一只使用 IMF-fixdate。
            </p>
            <p>
              所有时间均按 GMT/UTC 解释与生成，解析会交叉校验星期与日历日期；缺失 GMT
              后缀、非法月份或星期矛盾都会返回可读错误。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default HttpDateCodec;
