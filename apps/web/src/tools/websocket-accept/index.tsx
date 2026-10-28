'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { processLines, WEBSOCKET_GUID } from './utils/websocket';
import type { WsMode } from './utils/websocket';
import { MODE_OPTIONS, DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface AsyncResult {
  output: string;
  warnings: string[];
}

const WebsocketAccept: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<WsMode>('compute');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [result, setResult] = React.useState<AsyncResult>({ output: '', warnings: [] });

  React.useEffect(() => {
    let cancelled = false;
    processLines(input, mode).then((value) => {
      if (!cancelled) setResult(value);
    });
    return () => {
      cancelled = true;
    };
  }, [input, mode]);

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="输入"
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={mode}
              options={MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setMode(e.target.value as WsMode)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={
              mode === 'compute'
                ? '每行一个 Sec-WebSocket-Key（Base64，24 字符）…'
                : '每行一对「Sec-WebSocket-Key 空格 Sec-WebSocket-Accept」…'
            }
          />
        </Card>

        <Card
          className={styles.card}
          title="输出"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.map((warning, index) => (
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

      <Card size="small" title="RFC 6455 握手规则">
        <Space direction="vertical" size={4} className={styles.formula}>
          <span>Sec-WebSocket-Accept = Base64(SHA-1(Sec-WebSocket-Key + GUID))</span>
          <span>GUID = {WEBSOCKET_GUID}</span>
        </Space>
      </Card>

      <div className={styles.toolbar}>
        <Tag color="blue">{activeMode?.label}</Tag>
        <Space>
          <span className={styles.hint}>{activeMode?.hint}；SHA-1 由 Web Crypto 本地计算</span>
        </Space>
      </div>
    </div>
  );
};

export default WebsocketAccept;
