'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { computeEui64 } from './utils/eui64';
import { DEFAULT_MAC, DEFAULT_PREFIX, MAC_SAMPLES } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const IPv6Eui64Slaac: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mac, setMac] = React.useState(defaultInput || DEFAULT_MAC);
  const [prefix, setPrefix] = React.useState(DEFAULT_PREFIX);

  const result = React.useMemo(() => computeEui64(mac, prefix), [mac, prefix]);

  const copy = (text: string | null, label: string) => {
    if (!text) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="输入">
        <div className={styles.steps}>
          <div className={styles.stepRow}>
            <span className={styles.stepLabel}>MAC 地址</span>
            <Input
              value={mac}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMac(e.target.value)}
              spellCheck={false}
              className={styles.mono}
              style={{ width: 320 }}
              placeholder="00:1c:c0:ff:fe:80"
            />
          </div>
          <div className={styles.stepRow}>
            <span className={styles.stepLabel}>自定义 /64 前缀</span>
            <Input
              value={prefix}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}
              spellCheck={false}
              className={styles.mono}
              style={{ width: 320 }}
              placeholder="可选，如 2001:db8:abcd:0012::/64"
              allowClear
            />
          </div>
          <div className={styles.samples}>
            <span className={styles.stepLabel}>示例</span>
            {MAC_SAMPLES.map((sample) => (
              <Button key={sample} size="small" onClick={() => setMac(sample)}>
                {sample}
              </Button>
            ))}
          </div>
        </div>
        {result.error ? (
          <Alert type="error" showIcon message={result.error} className={styles.alert} />
        ) : null}
      </Card>

      <Card className={styles.card} title="派生过程与结果">
        {result.mac ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="① 规范化 MAC">{result.mac}</Descriptions.Item>
            <Descriptions.Item label="② 插入 ff:fe">
              <span className={styles.mono}>
                {result.mac.slice(0, 8)}
                <Tag color="orange" style={{ marginInline: 4 }}>
                  ff:fe
                </Tag>
                {result.mac.slice(8)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="③ 翻转 U/L 位">
              首字节 {result.firstByteBefore} → <Tag color="blue">{result.firstByteAfter}</Tag>
              （第 7 位取反）
            </Descriptions.Item>
            <Descriptions.Item label="接口标识符（EUI-64）">
              <span className={styles.mono}>{result.interfaceId}</span>
              <Button
                size="small"
                type="link"
                icon={<CopyOutlined />}
                onClick={() => copy(result.interfaceId, '接口标识符')}
              >
                复制
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="链路本地地址 fe80::/64">
              <span className={styles.mono}>{result.linkLocal}</span>
              <Button
                size="small"
                type="link"
                icon={<CopyOutlined />}
                onClick={() => copy(result.linkLocal, '链路本地地址')}
              >
                复制
              </Button>
            </Descriptions.Item>
            {result.slaac ? (
              <Descriptions.Item label="SLAAC 地址（自定义 /64 前缀）">
                <span className={styles.mono}>{result.slaac}</span>
                <Button
                  size="small"
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => copy(result.slaac, 'SLAAC 地址')}
                >
                  复制
                </Button>
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        ) : (
          <Alert type="warning" showIcon message="请输入合法的 48 位 MAC 地址" />
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="EUI-64 派生规则：在 MAC 的 OUI（前 3 字节）与设备标识（后 3 字节）之间插入 ff:fe，再将首字节第 7 位（U/L 位）取反；链路本地地址固定以 fe80::/64 为前缀。全部计算在浏览器本地完成。"
      />
    </div>
  );
};

export default IPv6Eui64Slaac;
