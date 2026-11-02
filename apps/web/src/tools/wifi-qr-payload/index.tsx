'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Select, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  buildWifiPayload,
  parseWifiPayload,
  type WifiConfig,
  type WifiEncryption,
} from './utils/wifi';
import { DEFAULT_PASSWORD, DEFAULT_SSID, ENCRYPTION_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const WifiQrPayload: React.FC<ToolComponentProps> = () => {
  const [encryption, setEncryption] = React.useState<WifiEncryption>('WPA');
  const [ssid, setSsid] = React.useState(DEFAULT_SSID);
  const [password, setPassword] = React.useState(DEFAULT_PASSWORD);
  const [hidden, setHidden] = React.useState(false);
  const [payloadText, setPayloadText] = React.useState('');
  const [parseError, setParseError] = React.useState('');

  const buildResult = React.useMemo(() => {
    try {
      return {
        payload: buildWifiPayload({ encryption, ssid, password, hidden }),
        error: '',
      };
    } catch (err) {
      return { payload: '', error: err instanceof Error ? err.message : String(err) };
    }
  }, [encryption, ssid, password, hidden]);

  const handleCopy = (text: string) => {
    if (!text) {
      message.error('暂无可复制的内容');
      return;
    }
    copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const handleParse = () => {
    try {
      const config: WifiConfig = parseWifiPayload(payloadText);
      setEncryption(config.encryption);
      setSsid(config.ssid);
      setPassword(config.password);
      setHidden(config.hidden);
      setParseError('');
      message.success('已解析并回填到表单');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    }
  };

  const isOpen = encryption === 'nopass';

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="网络信息（生成）">
          <Space direction="vertical" size={16} className={styles.form}>
            <div>
              <div className={styles.label}>加密类型</div>
              <Select
                value={encryption}
                className={styles.fullWidth}
                options={ENCRYPTION_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value: WifiEncryption) => setEncryption(value)}
              />
            </div>
            <div>
              <div className={styles.label}>网络名称（SSID）</div>
              <Input
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="如 MyHomeWiFi"
                spellCheck={false}
              />
            </div>
            <div>
              <div className={styles.label}>密码</div>
              <Input.Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isOpen ? '开放网络无需密码' : 'Wi-Fi 密码'}
                disabled={isOpen}
              />
            </div>
            <Checkbox checked={hidden} onChange={(e) => setHidden(e.target.checked)}>
              隐藏网络（不广播 SSID）
            </Checkbox>
            {buildResult.error ? (
              <Alert type="error" showIcon message={buildResult.error} />
            ) : null}
          </Space>
        </Card>

        <Card
          className={styles.card}
          title="WIFI Payload"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(buildResult.payload)}
            >
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={buildResult.payload}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
          <div className={styles.tips}>
            <Tag color="blue">zxing WIFI: 语法</Tag>
            <span className={styles.hint}>
              特殊字符（\ ; , &quot; :）已自动转义；将本字符串粘贴到任意二维码生成工具即可扫码连网。
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.label}>反向解析：粘贴已有的 WIFI payload 回填表单</div>
          <Input.TextArea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="WIFI:T:WPA;S:MyNet;P:password;;"
          />
          <div className={styles.parseRow}>
            <Button type="primary" onClick={handleParse}>
              解析并回填
            </Button>
          </div>
          {parseError ? <Alert type="error" showIcon message={parseError} /> : null}
        </Card>
      </div>
    </div>
  );
};

export default WifiQrPayload;
