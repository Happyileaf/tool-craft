'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  decodeSseStream,
  encodeSseStream,
  type SseDecodeResult,
  type SseMessage,
} from './utils/sse';
import { DEFAULT_DECODE_INPUT, DEFAULT_ENCODE_MESSAGES, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const { TextArea } = Input;

const DecodeView: React.FC = () => {
  const [stream, setStream] = React.useState(DEFAULT_DECODE_INPUT);

  const outcome = React.useMemo<{ result?: SseDecodeResult; error?: string }>(() => {
    if (stream.trim() === '') return {};
    try {
      return { result: decodeSseStream(stream) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [stream]);

  const columns = [
    { title: '#', dataIndex: 'index', key: 'index', width: 52 },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      width: 92,
      render: (kind: string) => (
        <Tag color={kind === 'message' ? 'blue' : 'default'}>
          {kind === 'message' ? '消息' : '注释'}
        </Tag>
      ),
    },
    {
      title: '行号',
      dataIndex: 'line',
      key: 'line',
      width: 72,
    },
    {
      title: '内容',
      key: 'content',
      render: (_: unknown, record: SseDecodeResult['entries'][number]) =>
        record.kind === 'comment' ? (
          <span className={styles.mono}>
            :{record.comment === '' ? '' : record.comment}
          </span>
        ) : (
          <Space direction="vertical" size={4} className={styles.fullWidth}>
            {record.event !== undefined && (
              <div>
                <Tag color="cyan">event</Tag>
                <span className={styles.mono}>{record.event}</span>
              </div>
            )}
            {record.id !== undefined && (
              <div>
                <Tag color="purple">id</Tag>
                <span className={styles.mono}>{record.id}</span>
              </div>
            )}
            {record.retry !== undefined && (
              <div>
                <Tag color="orange">retry</Tag>
                <span className={styles.mono}>{record.retry} ms</span>
              </div>
            )}
            {record.data !== undefined && (
              <pre className={styles.dataPre}>{record.data}</pre>
            )}
          </Space>
        ),
    },
  ];

  return (
    <div className={styles.panels}>
      <Card className={styles.card} title="SSE 流文本（text/event-stream）">
        <TextArea
          value={stream}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStream(e.target.value)}
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 14, maxRows: 24 }}
        />
        <div className={styles.hintBox}>
          支持 LF / CRLF / CR 三种换行；空行派发消息，冒号开头为注释，retry 非法时给出告警。
        </div>
      </Card>

      <Card
        className={styles.card}
        title={`解析结果（${outcome.result?.messages.length ?? 0} 条消息 / ${
          outcome.result?.entries.filter((entry) => entry.kind === 'comment').length ?? 0
        } 条注释）`}
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              if (!outcome.result) {
                message.warning('暂无可复制的结果');
                return;
              }
              copyToClipboard(JSON.stringify(outcome.result.messages, null, 2));
              message.success('消息 JSON 已复制');
            }}
          >
            复制 JSON
          </Button>
        }
      >
        {outcome.error ? (
          <Alert type="error" showIcon message={outcome.error} />
        ) : outcome.result ? (
          <Space direction="vertical" size="middle" className={styles.fullWidth}>
            {outcome.result.warnings.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="规范告警"
                description={
                  <ul className={styles.warningList}>
                    {outcome.result.warnings.map((warning, index) => (
                      <li key={index}>{warning.message}</li>
                    ))}
                  </ul>
                }
              />
            )}
            <Table
              size="small"
              pagination={false}
              rowKey={(record) => `${record.kind}-${record.index}`}
              columns={columns}
              dataSource={outcome.result.entries}
              locale={{ emptyText: <Empty description="空流不产生任何条目" /> }}
            />
          </Space>
        ) : (
          <Alert type="info" showIcon message="请输入 SSE 流文本" />
        )}
      </Card>
    </div>
  );
};

const EncodeView: React.FC = () => {
  const [jsonText, setJsonText] = React.useState(() =>
    JSON.stringify(DEFAULT_ENCODE_MESSAGES, null, 2),
  );

  const outcome = React.useMemo<{ stream?: string; error?: string }>(() => {
    if (jsonText.trim() === '') return {};
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        return { error: 'JSON 顶层必须是消息对象数组，例如 [{ "data": "hello" }]' };
      }
      return { stream: encodeSseStream(parsed as SseMessage[]) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [jsonText]);

  return (
    <div className={styles.panels}>
      <Card
        className={styles.card}
        title="消息数组 JSON"
        extra={
          <Button
            size="small"
            onClick={() => setJsonText(JSON.stringify(DEFAULT_ENCODE_MESSAGES, null, 2))}
          >
            重置示例
          </Button>
        }
      >
        <TextArea
          value={jsonText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonText(e.target.value)}
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 14, maxRows: 24 }}
        />
        <div className={styles.hintBox}>
          每条消息可含 data、event、id、retry 字段；data 中的换行自动拆为多个 data: 行。
        </div>
      </Card>

      <Card
        className={styles.card}
        title="编码后的 SSE 流"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              if (!outcome.stream) {
                message.warning('暂无可复制的结果');
                return;
              }
              copyToClipboard(outcome.stream);
              message.success('SSE 流已复制');
            }}
          >
            复制
          </Button>
        }
      >
        {outcome.error ? (
          <Alert type="error" showIcon message={outcome.error} />
        ) : outcome.stream ? (
          <pre className={styles.streamPre}>{outcome.stream}</pre>
        ) : (
          <Alert type="info" showIcon message="请输入消息 JSON" />
        )}
      </Card>
    </div>
  );
};

const SseCodec: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<'decode' | 'encode'>('decode');
  const activeOption = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <Card size="small" title="转换模式">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => setMode(e.target.value as 'decode' | 'encode')}
          />
          <span className={styles.hint}>{activeOption?.hint}</span>
        </div>
      </Card>

      {mode === 'decode' ? <DecodeView /> : <EncodeView />}
    </div>
  );
};

export default SseCodec;
