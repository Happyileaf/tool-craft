'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
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
  filterFrames,
  parseStack,
  serializeResult,
  type StackEngine,
  type StackFrame,
} from './utils/stack';
import { ENGINE_OPTIONS, SAMPLES, SAMPLE_V8 } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const ENGINE_COLOR: Record<StackEngine, string> = {
  v8: 'blue',
  firefox: 'orange',
  jsc: 'purple',
  unknown: 'default',
};

const ENGINE_LABEL: Record<StackEngine, string> = {
  v8: 'V8',
  firefox: 'Firefox',
  jsc: 'Safari / JSC',
  unknown: '未知',
};

/** 单帧标志位标签 */
function FlagTags({ frame }: { frame: StackFrame }) {
  const tags: Array<{ key: string; text: string; color: string }> = [];
  if (frame.flags.async) tags.push({ key: 'async', text: 'async', color: 'geekblue' });
  if (frame.flags.constructor) tags.push({ key: 'ctor', text: 'new', color: 'cyan' });
  if (frame.flags.eval) tags.push({ key: 'eval', text: 'eval', color: 'magenta' });
  if (frame.flags.native) tags.push({ key: 'native', text: 'native', color: 'gold' });
  if (frame.flags.nodeInternal) tags.push({ key: 'node', text: 'node:', color: 'volcano' });
  if (frame.flags.nodeModules) tags.push({ key: 'modules', text: 'node_modules', color: 'lime' });
  if (frame.flags.unparsed) tags.push({ key: 'unparsed', text: 'unparsed', color: 'error' });
  if (tags.length === 0) return <span className={styles.hint}>—</span>;
  return (
    <span className={styles.flagCell}>
      {tags.map((tag) => (
        <Tag key={tag.key} color={tag.color}>
          {tag.text}
        </Tag>
      ))}
    </span>
  );
}

/**
 * JavaScript 错误堆栈解析与结构化查看器：
 * 自动识别 V8 / Firefox / Safari 方言，输出统一帧表格、错误头与可复制 JSON。
 * 全部解析在浏览器本地完成，不上报错文。
 */
const JsErrorStackParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [raw, setRaw] = React.useState(defaultInput ?? SAMPLE_V8);
  const [forcedEngine, setForcedEngine] = React.useState<StackEngine>('unknown');
  const [hideNodeInternal, setHideNodeInternal] = React.useState(false);
  const [hideNodeModules, setHideNodeModules] = React.useState(false);
  const [hideNative, setHideNative] = React.useState(false);
  const [userOnly, setUserOnly] = React.useState(false);
  const [keyword, setKeyword] = React.useState('');

  const result = React.useMemo(() => parseStack(raw, forcedEngine), [raw, forcedEngine]);

  const visibleFrames = React.useMemo(
    () =>
      filterFrames(result.frames, {
        hideNodeInternal,
        hideNodeModules,
        hideNative,
        userOnly,
        keyword,
      }),
    [result.frames, hideNodeInternal, hideNodeModules, hideNative, userOnly, keyword],
  );

  const handleCopyJson = async () => {
    if (result.frames.length === 0 && !result.header) {
      message.warning('暂无可复制的解析结果');
      return;
    }
    await copyToClipboard(serializeResult(result));
    message.success('结构化 JSON 已复制');
  };

  const columns = [
    { title: '#', dataIndex: 'index', key: 'index', width: 56 },
    {
      title: '函数',
      dataIndex: 'functionName',
      key: 'functionName',
      width: 220,
      render: (text: string, record: StackFrame) => (
        <span className={styles.mono}>
          {text}
          {record.index === result.firstUserFrameIndex ? (
            <Tag color="green" style={{ marginLeft: 8 }}>
              首帧
            </Tag>
          ) : null}
        </span>
      ),
    },
    {
      title: '文件 / URL',
      dataIndex: 'file',
      key: 'file',
      render: (text: string | null) =>
        text ? <span className={styles.mono}>{text}</span> : <span className={styles.hint}>—</span>,
    },
    { title: '行', dataIndex: 'line', key: 'line', width: 70, render: (v: number | null) => v ?? '—' },
    { title: '列', dataIndex: 'column', key: 'column', width: 70, render: (v: number | null) => v ?? '—' },
    {
      title: '标志',
      key: 'flags',
      width: 220,
      render: (_: unknown, record: StackFrame) => <FlagTags frame={record} />,
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="JavaScript 错误堆栈解析器（V8 / Firefox / Safari）"
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopyJson}>
            复制 JSON
          </Button>
        }
      >
        <p className={styles.hint}>
          粘贴 Error.stack 原始文本，自动识别引擎方言并解析为统一帧结构（函数、文件、行、列、eval/native/async/node:
          标志）。纯本地字符串解析，不发起任何网络请求。
        </p>

        <div className={styles.toolbar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            size="small"
            value={forcedEngine}
            options={ENGINE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
            onChange={(event) => setForcedEngine(event.target.value as StackEngine)}
          />
          <Space size="small">
            {SAMPLES.map((sample) => (
              <Button key={sample.key} size="small" onClick={() => setRaw(sample.text)}>
                {sample.label}
              </Button>
            ))}
          </Space>
        </div>

        <Input.TextArea
          className={styles.textarea}
          style={{ marginTop: 12 }}
          rows={10}
          spellCheck={false}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="在此粘贴完整的 Error.stack 文本…"
        />

        {raw.trim() === '' ? (
          <Alert style={{ marginTop: 12 }} type="info" showIcon message="请先粘贴堆栈文本，或点击上方示例载入。" />
        ) : (
          <>
            <div className={styles.statRow} style={{ marginTop: 12 }}>
              <Tag color={ENGINE_COLOR[result.engine]}>引擎：{ENGINE_LABEL[result.engine]}</Tag>
              <Tag>总帧数：{result.frames.length}</Tag>
              <Tag>当前展示：{visibleFrames.length}</Tag>
              {result.header?.name ? <Tag color="red">错误：{result.header.name}</Tag> : null}
              {result.firstUserFrameIndex !== null ? (
                <Tag color="green">首帧序号：{result.firstUserFrameIndex}</Tag>
              ) : null}
            </div>

            {result.header ? (
              <Alert
                style={{ marginBottom: 12 }}
                type="error"
                showIcon
                message={result.header.name ? `${result.header.name}: ${result.header.message}` : result.header.message}
              />
            ) : null}
            {result.extraMessages.length > 0 ? (
              <Alert
                style={{ marginBottom: 12 }}
                type="warning"
                showIcon
                message="附加消息"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {result.extraMessages.map((line) => (
                      <li key={line} className={styles.mono}>
                        {line}
                      </li>
                    ))}
                  </ul>
                }
              />
            ) : null}

            <Space className={styles.toolbar} style={{ marginBottom: 8 }} wrap>
              <Checkbox checked={userOnly} onChange={(e) => setUserOnly(e.target.checked)}>
                仅看用户代码
              </Checkbox>
              <Checkbox checked={hideNodeInternal} onChange={(e) => setHideNodeInternal(e.target.checked)}>
                隐藏 node: 内置
              </Checkbox>
              <Checkbox checked={hideNodeModules} onChange={(e) => setHideNodeModules(e.target.checked)}>
                隐藏 node_modules
              </Checkbox>
              <Checkbox checked={hideNative} onChange={(e) => setHideNative(e.target.checked)}>
                隐藏 native
              </Checkbox>
              <Input.Search
                allowClear
                size="small"
                style={{ width: 220 }}
                placeholder="过滤函数名 / 文件关键字"
                onSearch={setKeyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Space>

            {visibleFrames.length > 0 ? (
              <Table
                size="small"
                rowKey="index"
                columns={columns}
                dataSource={visibleFrames}
                pagination={false}
                rowClassName={(record) => {
                  return record.index === result.firstUserFrameIndex
                    ? (styles.firstFrame as string)
                    : '';
                }}
                scroll={{ x: 900 }}
              />
            ) : (
              <Empty description="当前过滤条件下没有帧" />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default JsErrorStackParser;
