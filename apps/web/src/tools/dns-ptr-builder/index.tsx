'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, InputNumber, Space, Tag, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { buildPtr } from './utils/dnsPtr';
import { DEFAULT_INPUT, IPV4_PREFIX_OPTIONS, IPV6_PREFIX_OPTIONS, SAMPLE_VECTORS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * DNS PTR 反向解析记录名构造器：IPv4 输出 in-addr.arpa 名，
 * IPv6 按 RFC 3596 展开 32 个 nibble 反转输出 ip6.arpa 名，可选按前缀构造 zone。
 * 全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns PTR 记录名构造交互界面
 */
const DnsPtrBuilder: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [prefixRaw, setPrefixRaw] = React.useState<number | null>(null);

  const parsed = React.useMemo(() => {
    try {
      return { result: buildPtr(input, prefixRaw === null ? undefined : prefixRaw), error: null as string | null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [input, prefixRaw]);

  const copyText = async (text: string, label: string): Promise<void> => {
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  const prefixOptions = parsed.result?.version === 4 ? IPV4_PREFIX_OPTIONS : IPV6_PREFIX_OPTIONS;

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="DNS PTR 反向解析记录名构造器">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <span style={{ marginRight: 8, color: 'rgba(0,0,0,0.65)' }}>IP 地址：</span>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="如 192.0.2.10 或 2001:db8::1"
              className={styles.mono}
              style={{ maxWidth: 420 }}
            />
          </div>

          <div>
            <span style={{ marginRight: 8, color: 'rgba(0,0,0,0.65)' }}>前缀长度（可选，构造 zone 名）：</span>
            <InputNumber
              value={prefixRaw}
              onChange={(value) => setPrefixRaw(value)}
              min={0}
              max={parsed.result?.version === 4 ? 32 : 128}
              placeholder={parsed.result?.version === 4 ? '默认 32' : '默认 128'}
              style={{ width: 160 }}
            />
            <Space style={{ marginLeft: 8 }} wrap>
              {prefixOptions.map((prefix) => (
                <Tag
                  key={prefix}
                  color="blue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setPrefixRaw(prefix)}
                >
                  /{prefix}
                </Tag>
              ))}
            </Space>
          </div>

          {parsed.error ? (
            <Alert type="error" showIcon message={parsed.error} />
          ) : parsed.result ? (
            <>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="地址类型">
                  IPv{parsed.result.version}
                </Descriptions.Item>
                <Descriptions.Item label="规范化地址">
                  <span className={styles.mono}>{parsed.result.normalized}</span>
                </Descriptions.Item>
                <Descriptions.Item label="PTR 记录名（FQDN）">
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <span className={styles.mono}>{parsed.result.ptrName}</span>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(parsed.result?.ptrName ?? '', 'PTR 记录名')}>
                      复制
                    </Button>
                  </Space>
                </Descriptions.Item>
                {prefixRaw !== null ? (
                  <Descriptions.Item label={`反向 zone 名（/${parsed.result.prefixLength}）`}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <span className={styles.mono}>{parsed.result.zoneName}</span>
                      <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(parsed.result?.zoneName ?? '', 'zone 名')}>
                        复制
                      </Button>
                    </Space>
                  </Descriptions.Item>
                ) : null}
              </Descriptions>

              <div className={styles.hint}>
                IPv4 将四个八位组倒序后追加 <code>in-addr.arpa</code>；IPv6 先展开为完整 32 个十六进制 nibble，
                逐位倒序后追加 <code>ip6.arpa</code>（RFC 3596 §2.5）。指定前缀时，zone 名只保留网络段标签：
                如 IPv4 /24 为 <code>2.0.192.in-addr.arpa</code>，IPv6 /32 为{' '}
                <code>8.b.d.0.1.0.0.2.ip6.arpa</code>。等价命令：<code>dig -x {parsed.result.normalized}</code>。
              </div>
            </>
          ) : null}

          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { setInput(DEFAULT_INPUT); setPrefixRaw(null); }}>
              载入示例
            </Button>
          </Space>

          <Alert
            type="info"
            showIcon
            message="RFC 参考向量"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {SAMPLE_VECTORS.map((sample) => (
                  <li key={sample.input} className={styles.mono}>
                    {sample.input} → {sample.ptr}
                  </li>
                ))}
              </ul>
            }
          />
        </Space>
      </Card>
    </div>
  );
};

export default DnsPtrBuilder;
