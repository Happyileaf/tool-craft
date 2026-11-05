'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Segmented,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  decodeSse,
  encodeSse,
  type DecodedEvent,
  type SseMessage,
} from './utils/sse';
import styles from './index.module.css';

/** 编码页表单中的一条消息（retry 用字符串承载输入，空串表示不输出） */
interface MessageFormItem {
  /** 组件内使用的唯一标识 */
  key: number;
  /** 消息数据文本 */
  data: string;
  /** 事件类型（可留空） */
  event: string;
  /** 最后事件 ID（可留空） */
  id: string;
  /** 重连毫秒数输入（可留空） */
  retry: string;
  /** 注释/心跳内容（可留空） */
  comment: string;
}

/** 解码页示例文本，覆盖注释、多行 data、非法 retry 与无 data 缓冲 */
const DECODE_SAMPLE = [
  ': 心跳注释',
  'id: 101',
  'event: update',
  'retry: 3000',
  'data: {"id":1,"name":"first"}',
  '',
  'retry: not-a-number',
  'data: 第二行第一行',
  'data: 第二行第二行',
  '',
  'event: ghost',
  '',
  'data: 结尾消息',
  '',
].join('\n');

/**
 * 创建一条空白表单消息
 *
 * @param key - 组件内唯一标识
 * @returns 空白表单项
 */
function createEmptyMessage(key: number): MessageFormItem {
  return { key, data: '', event: '', id: '', retry: '', comment: '' };
}

/**
 * 构造编码页的示例消息列表
 *
 * @returns 带 key 的示例表单项数组
 */
function createSampleMessages(): MessageFormItem[] {
  return [
    {
      key: 1,
      data: '服务器时间：2026-11-06T10:00:00Z',
      event: 'time',
      id: '1',
      retry: '5000',
      comment: '定时心跳',
    },
    {
      key: 2,
      data: '第一行数据\n第二行数据',
      event: 'notice',
      id: '2',
      retry: '',
      comment: '',
    },
  ];
}

/**
 * 将表单数据转换为编码函数入参，空字符串字段不输出
 *
 * @param items - 表单消息列表
 * @returns SSE 结构化消息数组
 */
function toSseMessages(items: MessageFormItem[]): SseMessage[] {
  return items.map((item) => {
    const sseMessage: SseMessage = { data: item.data };
    if (item.event.trim() !== '') {
      sseMessage.event = item.event;
    }
    if (item.id.trim() !== '') {
      sseMessage.id = item.id;
    }
    if (item.retry.trim() !== '') {
      sseMessage.retry = Number(item.retry);
    }
    if (item.comment.trim() !== '') {
      sseMessage.comment = item.comment;
    }
    return sseMessage;
  });
}

/** 解码结果表格列定义 */
const EVENT_COLUMNS: ColumnsType<DecodedEvent> = [
  { title: '#', width: 56, render: (_, __, index) => index + 1 },
  {
    title: 'event',
    dataIndex: 'event',
    width: 120,
    render: (event: string | null) =>
      event === null ? <Tag>未设置</Tag> : <Tag color="blue">{event}</Tag>,
  },
  {
    title: 'id',
    dataIndex: 'id',
    width: 120,
    render: (id: string | null) => (id === null ? <Tag>未设置</Tag> : <code>{id}</code>),
  },
  {
    title: 'retry (ms)',
    dataIndex: 'retry',
    width: 110,
    render: (retry: number | null) => (retry === null ? <Tag>未设置</Tag> : retry),
  },
  {
    title: 'data',
    dataIndex: 'data',
    render: (data: string) => <pre className={styles.cellPre}>{data}</pre>,
  },
];

/**
 * SSE（Server-Sent Events）消息格式编码/解码器。
 *
 * 依据 HTML 标准 §9.2 text/event-stream 实现结构化消息与线格式文本的
 * 双向转换，提供可增删的消息表单、实时预览、流文本解析与行号级警告，
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @returns SSE 编解码交互界面
 */
const SseCodec: React.FC<ToolComponentProps> = () => {
  const [messages, setMessages] = React.useState<MessageFormItem[]>(createSampleMessages);
  const [streamText, setStreamText] = React.useState<string>('');
  const [decodeView, setDecodeView] = React.useState<'table' | 'json'>('table');

  const encodeResult = React.useMemo(() => encodeSse(toSseMessages(messages)), [messages]);
  const decoded = React.useMemo(() => decodeSse(streamText), [streamText]);

  /**
   * 更新指定消息的某个字段
   *
   * @param key - 消息标识
   * @param field - 字段名
   * @param value - 新值
   */
  const updateMessage = (
    key: number,
    field: keyof Omit<MessageFormItem, 'key'>,
    value: string,
  ): void => {
    setMessages((previous) =>
      previous.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  };

  /** 追加一条空白消息 */
  const addMessage = (): void => {
    setMessages((previous) => {
      const nextKey = previous.reduce((max, item) => Math.max(max, item.key), 0) + 1;
      return [...previous, createEmptyMessage(nextKey)];
    });
  };

  /**
   * 删除指定消息
   *
   * @param key - 消息标识
   */
  const removeMessage = (key: number): void => {
    setMessages((previous) => previous.filter((item) => item.key !== key));
  };

  /** 复制编码预览到剪贴板 */
  const handleCopyOutput = async (): Promise<void> => {
    if (!encodeResult.ok || encodeResult.output === '') {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(encodeResult.output);
    message.success('text/event-stream 内容已复制');
  };

  /** 复制解析结果 JSON 到剪贴板 */
  const handleCopyEvents = async (): Promise<void> => {
    if (decoded.events.length === 0) {
      message.warning('暂无可复制的事件');
      return;
    }
    await copyToClipboard(JSON.stringify(decoded.events, null, 2));
    message.success('事件 JSON 已复制');
  };

  const encodeTab = (
    <div className={styles.container}>
      <Space wrap>
        <Button icon={<PlusOutlined />} type="primary" onClick={addMessage}>
          添加消息
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => setMessages(createSampleMessages())}
        >
          示例填充
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={() => setMessages([createEmptyMessage(1)])}
        >
          清空
        </Button>
      </Space>

      {messages.map((item, index) => (
        <Card
          key={item.key}
          size="small"
          className={styles.messageCard}
          title={
            <div className={styles.messageHeader}>
              <span>消息 {index + 1}</span>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={messages.length === 1}
                onClick={() => removeMessage(item.key)}
              >
                删除
              </Button>
            </div>
          }
        >
          <div className={styles.field}>
            <span className={styles.label}>data（多行自动拆分为多个 data: 行）</span>
            <Input.TextArea
              value={item.data}
              onChange={(event) => updateMessage(item.key, 'data', event.target.value)}
              placeholder='消息数据，如 {"status":"ok"}'
              autoSize={{ minRows: 2, maxRows: 8 }}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.rowField}>
              <span className={styles.label}>event</span>
              <Input
                value={item.event}
                onChange={(event) => updateMessage(item.key, 'event', event.target.value)}
                placeholder="如 update（可留空）"
              />
            </div>
            <div className={styles.rowField}>
              <span className={styles.label}>id</span>
              <Input
                value={item.id}
                onChange={(event) => updateMessage(item.key, 'id', event.target.value)}
                placeholder="最后事件 ID（可留空）"
              />
            </div>
            <div className={styles.rowField}>
              <span className={styles.label}>retry（毫秒，非负整数）</span>
              <Input
                value={item.retry}
                onChange={(event) => updateMessage(item.key, 'retry', event.target.value)}
                placeholder="如 5000（可留空）"
              />
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>注释/心跳（输出为以冒号开头的行，可留空）</span>
            <Input
              value={item.comment}
              onChange={(event) => updateMessage(item.key, 'comment', event.target.value)}
              placeholder="如 keep-alive"
            />
          </div>
        </Card>
      ))}

      {!encodeResult.ok ? (
        <Alert
          type="error"
          showIcon
          message="校验失败，未生成输出"
          description={
            <ul className={styles.alertList}>
              {encodeResult.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card
        title="text/event-stream 预览"
        extra={
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyOutput}>
            复制
          </Button>
        }
      >
        {encodeResult.ok && encodeResult.output !== '' ? (
          <pre className={styles.output}>{encodeResult.output}</pre>
        ) : (
          <Empty description="尚无内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        <div className={styles.hint}>
          字段输出顺序固定为 id → event → retry → data，每条消息以空行分隔；全部内容仅在浏览器本地拼装。
        </div>
      </Card>
    </div>
  );

  const decodeTab = (
    <div className={styles.container}>
      <Space wrap>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => setStreamText(DECODE_SAMPLE)}
        >
          载入示例
        </Button>
        <Button icon={<ClearOutlined />} onClick={() => setStreamText('')}>
          清空
        </Button>
        <Button icon={<CopyOutlined />} onClick={handleCopyEvents}>
          复制事件 JSON
        </Button>
      </Space>

      <Card title="原始 SSE 流文本">
        <Input.TextArea
          value={streamText}
          onChange={(event) => setStreamText(event.target.value)}
          placeholder={'粘贴 text/event-stream 文本，例如：\nevent: update\ndata: hello\n\n'}
          autoSize={{ minRows: 8, maxRows: 20 }}
          className={styles.streamInput}
        />
      </Card>

      {decoded.skipped > 0 ? (
        <Alert
          type="info"
          showIcon
          message={`跳过 ${decoded.skipped} 条无 data 行的缓冲事件`}
          description="与浏览器 EventSource 行为一致：仅包含 event / id / retry 而没有任何 data 行的缓冲不会派发。"
        />
      ) : null}

      {decoded.warnings.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={`${decoded.warnings.length} 条警告（已按规范忽略非法内容）`}
          description={
            <ul className={styles.alertList}>
              {decoded.warnings.map((warning) => (
                <li key={`${warning.line}-${warning.message}`}>
                  第 {warning.line} 行：{warning.message}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card
        title={`解析结果（${decoded.events.length} 条事件）`}
        extra={
          <Segmented
            value={decodeView}
            onChange={(value) => setDecodeView(value as 'table' | 'json')}
            options={[
              { label: '表格视图', value: 'table' },
              { label: 'JSON 视图', value: 'json' },
            ]}
          />
        }
      >
        {decoded.events.length === 0 ? (
          <Empty
            description="暂无可派发事件（注意：没有结尾空行的缓冲不会派发）"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : decodeView === 'table' ? (
          <Table<DecodedEvent>
            rowKey={(_, index) => String(index)}
            columns={EVENT_COLUMNS}
            dataSource={decoded.events}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <pre className={styles.output}>{JSON.stringify(decoded.events, null, 2)}</pre>
        )}
      </Card>
    </div>
  );

  return (
    <Tabs
      defaultActiveKey="encode"
      items={[
        { key: 'encode', label: '编码', children: encodeTab },
        { key: 'decode', label: '解码', children: decodeTab },
      ]}
    />
  );
};

export default SseCodec;
