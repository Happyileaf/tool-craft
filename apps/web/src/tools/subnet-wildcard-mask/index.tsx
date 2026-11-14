'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { processMask, processLines, computeNetwork } from './utils/subnetMask';
import { DEFAULT_INPUT, DEFAULT_IP } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const SubnetWildcardMask: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [ip, setIp] = React.useState(DEFAULT_IP);

  const batch = React.useMemo(() => processLines(input), [input]);

  const first = React.useMemo(() => {
    const line = input.split('\n').find((item) => item.trim() !== '');
    return line ? processMask(line) : null;
  }, [input]);

  const network = React.useMemo(() => {
    if (!first || !first.valid) return null;
    return computeNetwork(ip, first.prefix);
  }, [first, ip]);

  const handleCopy = () => {
    if (batch.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(batch.output);
    message.success('已复制转换结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="输入掩码（子网掩码或反掩码，每行一个）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder="255.255.255.0 或 0.0.0.255，支持多行批量…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出对侧掩码（自动识别方向）"
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
            autoSize={{ minRows: 10, maxRows: 20 }}
          />
          {batch.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {batch.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      {first && first.valid ? (
        <Card size="small" title="首行掩码推导">
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>识别为</span>
              <span className={styles.metaValue}>
                {first.kind === 'subnet' ? '子网掩码' : '反掩码（Wildcard）'}
              </span>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>前缀长度</span>
              <span className={styles.metaValue}>{`/${first.prefix}`}</span>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>主机位</span>
              <span className={styles.metaValue}>{first.hostBits}</span>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>子网掩码</span>
              <span className={styles.metaValue}>{first.subnetMask}</span>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>反掩码</span>
              <span className={styles.metaValue}>{first.wildcardMask}</span>
            </span>
          </div>
        </Card>
      ) : null}

      {first && first.valid ? (
        <Card size="small" title="网络地址推导（基于下方 IP 与首行前缀）">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Input
              value={ip}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIp(e.target.value)}
              spellCheck={false}
              placeholder="输入一个 IPv4 地址，如 192.168.1.100"
            />
            {network && network.valid ? (
              <div className={styles.networkGrid}>
                <div className={styles.networkItem}>
                  <span className={styles.networkLabel}>网络地址</span>
                  <span className={styles.networkValue}>{network.networkAddress}</span>
                </div>
                <div className={styles.networkItem}>
                  <span className={styles.networkLabel}>广播地址</span>
                  <span className={styles.networkValue}>{network.broadcastAddress}</span>
                </div>
                <div className={styles.networkItem}>
                  <span className={styles.networkLabel}>首个可用主机</span>
                  <span className={styles.networkValue}>{network.firstHost}</span>
                </div>
                <div className={styles.networkItem}>
                  <span className={styles.networkLabel}>末尾可用主机</span>
                  <span className={styles.networkValue}>{network.lastHost}</span>
                </div>
                <div className={styles.networkItem}>
                  <span className={styles.networkLabel}>可用主机数</span>
                  <span className={styles.networkValue}>{network.hostCount}</span>
                </div>
              </div>
            ) : (
              <Alert type="warning" showIcon message={network?.error ?? 'IP 地址无效'} />
            )}
          </Space>
        </Card>
      ) : null}

      <div className={styles.toolbar}>
        <Tag color="blue">IPv4</Tag>
        <span className={styles.hint}>
          纯位运算本地计算、零依赖；自动识别子网掩码 / 反掩码方向，多行批量逐行标注错误
        </span>
      </div>
    </div>
  );
};

export default SubnetWildcardMask;
