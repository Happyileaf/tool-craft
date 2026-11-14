'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Space,
  Statistic,
  Tag,
  message,
  type RadioChangeEvent,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { normalizeBatch } from './utils/base64url';
import { DEFAULT_INPUT, MODE_OPTIONS, type ConvertMode } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const Base64UrlNormalizer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [mode, setMode] = React.useState<ConvertMode>('auto');

  const batch = React.useMemo(() => normalizeBatch(input, mode), [input, mode]);
  const failures = batch.lines.filter((l) => !l.ok);

  const handleCopy = () => {
    if (batch.output.trim() === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(batch.output);
    message.success('已复制规范化结果');
  };

  const variantLabel = (variant: 'standard' | 'url' | null, padded: boolean): string => {
    if (!variant) return '空行';
    return variant === 'standard'
      ? `标准 Base64${padded ? '（含填充）' : ''}`
      : `Base64URL${padded ? '（含填充）' : '（无填充）'}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          value={mode}
          onChange={(e: RadioChangeEvent) => setMode(e.target.value as ConvertMode)}
          optionType="button"
          buttonStyle="solid"
          options={MODE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
        />
      </div>

      <div className={styles.panels}>
        <Card className={styles.card} title="输入令牌（每行一个，空行保留）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 24 }}
            placeholder="粘贴标准 Base64 或 Base64URL 令牌，支持 JWT 片段、OIDC nonce 等多行批量…"
          />
        </Card>

        <Card
          className={styles.card}
          title="规范化输出"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={batch.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 24 }}
          />
        </Card>
      </div>

      <Space className={styles.stats}>
        <Statistic title="成功行数" value={batch.successCount} />
        <Statistic title="失败行数" value={batch.failureCount} />
      </Space>

      {failures.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={`${failures.length} 行无法规范化（已原样保留）`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {failures.slice(0, 20).map((line) => (
                <li key={line.line}>
                  第 {line.line} 行：{line.error}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card size="small" title="逐行识别结果">
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          {batch.lines.map((line) => (
            <div key={line.line} className={styles.lineMeta}>
              <Tag color={line.ok ? 'green' : 'red'}>第 {line.line} 行</Tag>
              {line.variant ? (
                <Tag className={styles.variantTag} color={line.variant === 'url' ? 'blue' : 'purple'}>
                  {variantLabel(line.variant, line.padded)}
                </Tag>
              ) : (
                <Tag>空行</Tag>
              )}
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
                {line.ok ? line.output : `（原样保留）${line.output}`}
              </span>
            </div>
          ))}
        </Space>
      </Card>

      <div>
        <Tag color="orange">RFC 4648</Tag>
        <span className={styles.hint}>
          纯字符替换与确定性校验、零依赖本地计算；不依赖 atob 处理 URL 变体，缺失填充自动补齐，非法字符与长度带行号定位
        </span>
      </div>
    </div>
  );
};

export default Base64UrlNormalizer;
