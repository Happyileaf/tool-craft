'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  decodeResp,
  encodeResp,
  toResp2,
  type RespType,
  type RespValue,
} from './utils/resp';
import styles from './index.module.css';

/** 解码页示例：一条 RESP3 回复流，覆盖数组、bulk、整数与 null */
const DECODE_SAMPLE = [
  '*3',
  '$5',
  'hello',
  ':42',
  '_',
  '',
].join('\r\n');

/** 构造器可选的标量/容器类型 */
const TYPE_OPTIONS: { label: string; value: RespType }[] = [
  { label: 'Bulk String ($)', value: 'bulk-string' },
  { label: 'Simple String (+)', value: 'simple-string' },
  { label: 'Error (-)', value: 'error' },
  { label: 'Integer (:)', value: 'integer' },
  { label: 'Null (_)', value: 'null' },
  { label: 'Double (,)', value: 'double' },
  { label: 'Boolean (#)', value: 'boolean' },
  { label: 'Big Number (()', value: 'big-number' },
  { label: 'Verbatim (=)', value: 'verbatim-string' },
  { label: 'Array (*)', value: 'array' },
];

/** 构造器中的一条表单项 */
interface BuilderItem {
  /** 组件内唯一标识 */
  key: number;
  /** 所选 RESP 类型 */
  type: RespType;
  /** 标量文本或 bulk 数据 */
  raw: string;
}

/** 类型对应的展示颜色 */
const TAG_COLOR: Partial<Record<RespType, string>> = {
  error: 'red',
  'bulk-error': 'red',
  null: 'default',
  integer: 'blue',
  'big-number': 'blue',
  double: 'geekblue',
  boolean: 'purple',
  map: 'gold',
  array: 'green',
  set: 'green',
  push: 'cyan',
};

/**
 * 把构造器表单项转换为结构化 RESP 值。
 *
 * @param item - 表单项
 * @returns RESP 值；null 类型无负载
 */
function toRespValue(item: BuilderItem): RespValue {
  switch (item.type) {
    case 'null':
      return { type: 'null' };
    case 'integer':
    case 'big-number':
      return { type: item.type, value: BigInt(item.raw || '0') };
    case 'double':
      if (item.raw === 'inf' || item.raw === '-inf' || item.raw === 'nan') {
        return { type: 'double', value: item.raw };
      }
      return { type: 'double', value: Number(item.raw || '0') };
    case 'boolean':
      return { type: 'boolean', value: item.raw === 'true' };
    case 'simple-string':
    case 'error':
      return { type: item.type, value: item.raw };
    case 'verbatim-string':
      return { type: 'verbatim-string', value: 'txt', data: item.raw };
    default:
      return { type: 'bulk-string', data: item.raw };
  }
}

/**
 * 递归渲染结构化 RESP 值的只读树。
 *
 * @param value - RESP 值
 * @param depth - 当前缩进深度
 * @returns 树节点
 */
function RespTree({ value, depth }: { value: RespValue; depth: number }): React.ReactElement {
  const tag = (
    <Tag className={styles.typeTag} color={TAG_COLOR[value.type] ?? 'default'}>
      {value.type}
    </Tag>
  );

  if (value.elements) {
    return (
      <div>
        <div className={styles.treeNode}>
          {tag}
          <span className={styles.label}>{value.elements.length} 个元素</span>
        </div>
        <div className={styles.treeChildren}>
          {value.elements.map((child, index) => (
            // 深度与下标组合在单次渲染内足够唯一
            <RespTree key={`${depth}-${index}`} value={child} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  const display =
    value.type === 'null'
      ? '(nil)'
      : value.type === 'verbatim-string'
        ? `${String(value.value)}: ${value.data ?? ''}`
        : value.type === 'bulk-string' ||
            value.type === 'bulk-error' ||
            value.type === 'streamed-string-part'
          ? value.data ?? ''
          : String(value.value ?? '');

  return (
    <div className={styles.treeNode}>
      {tag}
      <span className={styles.valueText}>{display}</span>
    </div>
  );
}

/**
 * Redis RESP 协议编解码调试器。
 *
 * 解码页把 RESP2/RESP3 线格式文本解析为带类型标签的结构化树并保留半包残片；
 * 编码页通过表单构造结构化消息并输出线格式，支持一键降级为 RESP2 兼容表示。
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @returns RESP 编解码交互界面
 */
const RedisProtocolCodec: React.FC<ToolComponentProps> = () => {
  const [streamText, setStreamText] = React.useState<string>('');
  const [items, setItems] = React.useState<BuilderItem[]>([
    { key: 1, type: 'bulk-string', raw: 'GET' },
    { key: 2, type: 'bulk-string', raw: 'mykey' },
  ]);
  const [resp2Mode, setResp2Mode] = React.useState<boolean>(false);

  const decoded = React.useMemo(() => decodeResp(streamText), [streamText]);

  const encodeResult = React.useMemo(() => {
    try {
      const values = items.map(toRespValue);
      return encodeResp(resp2Mode ? values.map(toResp2) : values);
    } catch (error) {
      return {
        ok: false as const,
        errors: [error instanceof Error ? error.message : '元素构造失败，请检查输入'],
      };
    }
  }, [items, resp2Mode]);

  /**
   * 更新指定表单项字段
   *
   * @param key - 表单项标识
   * @param patch - 字段补丁
   */
  const updateItem = (key: number, patch: Partial<BuilderItem>): void => {
    setItems((previous) =>
      previous.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  /** 追加一条空白表单项 */
  const addItem = (): void => {
    setItems((previous) => {
      const nextKey = previous.reduce((max, item) => Math.max(max, item.key), 0) + 1;
      return [...previous, { key: nextKey, type: 'bulk-string', raw: '' }];
    });
  };

  /**
   * 删除指定表单项
   *
   * @param key - 表单项标识
   */
  const removeItem = (key: number): void => {
    setItems((previous) => previous.filter((item) => item.key !== key));
  };

  /** 复制编码输出 */
  const handleCopyOutput = async (): Promise<void> => {
    if (!encodeResult.ok || encodeResult.output === '') {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(encodeResult.output);
    message.success('RESP 线格式已复制');
  };

  /** 复制解析结果 JSON */
  const handleCopyJson = async (): Promise<void> => {
    if (decoded.messages.length === 0) {
      message.warning('暂无可复制的消息');
      return;
    }
    await copyToClipboard(JSON.stringify(decoded.messages, replacer, 2));
    message.success('结构化 JSON 已复制');
  };

  const decodeTab = (
    <div className={styles.container}>
      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={() => setStreamText(DECODE_SAMPLE)}>
          载入示例
        </Button>
        <Button icon={<ClearOutlined />} onClick={() => setStreamText('')}>
          清空
        </Button>
        <Button icon={<CopyOutlined />} onClick={handleCopyJson}>
          复制 JSON
        </Button>
      </Space>

      <Card title="RESP 线格式输入（CRLF 行结束）">
        <Input.TextArea
          value={streamText}
          onChange={(event) => setStreamText(event.target.value)}
          placeholder={'粘贴 RESP 文本，例如：\r\n*2\r\n$3\r\nGET\r\n$5\r\nmykey\r\n'}
          autoSize={{ minRows: 8, maxRows: 20 }}
          className={styles.streamInput}
        />
      </Card>

      {decoded.error ? (
        <Alert
          type="error"
          showIcon
          message="解析中断"
          description={
            <ul className={styles.alertList}>
              <li>{decoded.error}</li>
              {decoded.remainder ? <li>残片：{decoded.remainder}</li> : null}
            </ul>
          }
        />
      ) : null}

      {!decoded.error && decoded.remainder ? (
        <Alert
          type="info"
          showIcon
          message="检测到半包残片"
          description={`末尾 ${decoded.remainder.length} 个字符尚未构成完整消息，可留待下次数据到达后拼接解析。`}
        />
      ) : null}

      <Card title={`解析结果（${decoded.messages.length} 条消息）`}>
        {decoded.messages.length === 0 ? (
          <Empty description="尚无完整消息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className={styles.tree}>
            {decoded.messages.map((value, index) => (
              <RespTree key={index} value={value} depth={0} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const encodeTab = (
    <div className={styles.container}>
      <Space wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={addItem}>
          添加元素
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            setItems([
              { key: 1, type: 'bulk-string', raw: 'GET' },
              { key: 2, type: 'bulk-string', raw: 'mykey' },
            ])
          }
        >
          示例填充
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={() => setItems([{ key: 1, type: 'bulk-string', raw: '' }])}
        >
          清空
        </Button>
        <Tag color={resp2Mode ? 'orange' : 'blue'} style={{ marginInlineStart: 8 }}>
          {resp2Mode ? 'RESP2 兼容输出' : 'RESP3 输出'}
        </Tag>
        <Button size="small" onClick={() => setResp2Mode((value) => !value)}>
          切换到{resp2Mode ? 'RESP3' : 'RESP2'}
        </Button>
      </Space>

      {items.map((item) => (
        <Card
          key={item.key}
          size="small"
          title={
            <Space>
              <span>元素</span>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={items.length === 1}
                onClick={() => removeItem(item.key)}
              >
                删除
              </Button>
            </Space>
          }
        >
          <div className={styles.builderRow}>
            <div className={styles.builderField}>
              <span className={styles.label}>类型</span>
              <Select
                value={item.type}
                options={TYPE_OPTIONS}
                onChange={(type) => updateItem(item.key, { type })}
              />
            </div>
            <div className={styles.builderField}>
              <span className={styles.label}>
                {item.type === 'boolean'
                  ? '值（true / false）'
                  : item.type === 'double'
                    ? '值（数字或 inf/-inf/nan）'
                    : item.type === 'null'
                      ? '无负载'
                      : '值 / 数据'}
              </span>
              <Input
                value={item.raw}
                disabled={item.type === 'null'}
                onChange={(event) => updateItem(item.key, { raw: event.target.value })}
                placeholder={item.type === 'integer' ? '如 42' : '输入内容'}
                className={styles.mono}
              />
            </div>
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
        title="RESP 线格式预览"
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
          元素将统一包装为一条 Array 请求；bulk 长度按 UTF-8 字节计数。全部内容仅在浏览器本地拼装。
        </div>
      </Card>
    </div>
  );

  return (
    <Tabs
      defaultActiveKey="decode"
      items={[
        { key: 'decode', label: '解码解析', children: decodeTab },
        { key: 'encode', label: '编码构造', children: encodeTab },
      ]}
    />
  );
};

/**
 * JSON 序列化时把 BigInt 转为字符串，避免 TypeError。
 *
 * @param _key - 字段名
 * @param value - 字段值
 * @returns 可序列化值
 */
function replacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

export default RedisProtocolCodec;
