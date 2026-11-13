'use client';

import React from 'react';
import { Alert, Button, Card, Input, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { SAMPLE_BASE, SAMPLE_REFERENCES } from './constants';
import { resolveReference } from './utils/urlResolve';
import styles from './index.module.css';

/**
 * RFC 3986 相对引用解析器：给定 Base URI 与 relative-ref，
 * 按 §5.2.2 transform references / §5.2.4 remove_dot_segments 求目标 URI。
 * 不依赖 WHATWG URL，保证与 RFC 官方案例逐字符一致且过程可解释。
 */
const RelativeUrlResolver: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [base, setBase] = React.useState<string>(SAMPLE_BASE);
  const [reference, setReference] = React.useState<string>(defaultInput ?? SAMPLE_REFERENCES[0] ?? '');

  const result = React.useMemo(() => resolveReference(base, reference), [base, reference]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const components = result.ok ? result.components : undefined;

  return (
    <div className={styles.container}>
      <Card title="输入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.field}>
            <label>Base URI（必须是绝对 URI）</label>
            <Input
              className={styles.mono}
              value={base}
              onChange={(event) => setBase(event.target.value)}
              placeholder="例如 http://a/b/c/d;p?q"
            />
          </div>
          <div className={styles.field}>
            <label>相对引用 / URI reference</label>
            <Input
              className={styles.mono}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="例如 ../../g 或 //host/path"
            />
            <div className={styles.samples}>
              {SAMPLE_REFERENCES.map((sample) => (
                <Tag
                  key={sample}
                  className={styles.mono}
                  onClick={() => sample !== undefined && setReference(sample)}
                >
                  {sample}
                </Tag>
              ))}
            </div>
          </div>
          <Button size="small" onClick={() => setBase(SAMPLE_BASE)}>
            重置为 RFC 示例 Base
          </Button>
        </Space>
      </Card>

      {result.ok ? (
        <Card title="解析结果">
          <div className={`${styles.resultBox} ${styles.mono}`}>{result.target}</div>
          <Button
            size="small"
            type="primary"
            icon={<CopyOutlined />}
            style={{ marginTop: 8 }}
            onClick={() => handleCopy(result.target)}
          >
            复制目标 URI
          </Button>

          {components ? (
            <dl className={styles.componentGrid}>
              <dt>scheme</dt>
              <dd className={styles.mono}>{components.scheme || '—'}</dd>
              <dt>authority</dt>
              <dd className={styles.mono}>{components.authority || '—'}</dd>
              <dt>path</dt>
              <dd className={styles.mono}>{components.path || '—'}</dd>
              <dt>query</dt>
              <dd className={styles.mono}>{components.query || '—'}</dd>
              <dt>fragment</dt>
              <dd className={styles.mono}>{components.fragment || '—'}</dd>
            </dl>
          ) : null}
        </Card>
      ) : (
        <Alert type="error" showIcon message="解析失败" description={result.error} />
      )}

      <Alert
        type="info"
        showIcon
        message="解析规则（RFC 3986 §5）"
        description={
          <div className={styles.hint}>
            <p>
              引用自带 scheme 时整体替换；否则继承 Base 的 scheme。带
              <span className={styles.mono}>{' // '}</span>
              开头（network-path）时替换 authority 并重置 path；相对路径先与 Base
              路径目录合并，再执行 remove_dot_segments 消除
              <span className={styles.mono}>{' . '}</span>与
              <span className={styles.mono}>{' .. '}</span>
              段。query 与 fragment 按引用是否显式给出决定覆盖或继承。
            </p>
            <p>
              本工具手写实现输入缓冲/输出栈算法，未调用浏览器
              <span className={styles.mono}> new URL()</span>
              ，因此对空 authority、保留点段等边界与 RFC 官方案例保持一致。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default RelativeUrlResolver;
