'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Switch, Table, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { DIRECTIONS, MARKER_REFERENCE, type ConvertDirection } from './constants';
import { EdnError, SAMPLE_EDN, ednToJson, jsonToEdn } from './utils/edn';
import styles from './index.module.css';

const SAMPLE_JSON = `{
  ":person/name": "Alice",
  ":person/active": true,
  ":person/tags": {
    "___edn_type": "set",
    "items": [
      { "___edn_type": "keyword", "value": ":admin" }
    ]
  }
}`;

/**
 * Clojure EDN ↔ JSON 双向转换器：
 * 实时解析并输出对端格式，错误带字符位置，支持紧凑/缩进切换与一键复制。
 */
const EdnJsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<ConvertDirection>('edn-to-json');
  const [input, setInput] = React.useState<string>(defaultInput ?? SAMPLE_EDN);
  const [compact, setCompact] = React.useState<boolean>(false);

  const conversion = React.useMemo(() => {
    if (input.trim() === '') {
      return { output: '', error: undefined };
    }
    try {
      if (direction === 'edn-to-json') {
        return { output: ednToJson(input, compact ? 0 : 2), error: undefined };
      }
      return { output: jsonToEdn(input, compact ? 0 : 2), error: undefined };
    } catch (error) {
      const detail =
        error instanceof EdnError
          ? error.message
          : error instanceof SyntaxError
            ? `JSON 语法错误：${error.message}`
            : (error as Error).message;
      return { output: '', error: detail };
    }
  }, [input, direction, compact]);

  const swapDirection = () => {
    const next = direction === 'edn-to-json' ? 'json-to-edn' : 'edn-to-json';
    setDirection(next);
    // 若当前转换成功，把输出作为新方向的输入，形成往返编辑
    if (conversion.output) {
      setInput(conversion.output);
    }
  };

  const handleCopy = async () => {
    if (!conversion.output) {
      message.warning('暂无可复制的输出');
      return;
    }
    await copyToClipboard(conversion.output);
    message.success('已复制到剪贴板');
  };

  const loadSample = () => {
    setInput(direction === 'edn-to-json' ? SAMPLE_EDN : SAMPLE_JSON);
  };

  const sourceLabel = direction === 'edn-to-json' ? 'EDN 输入' : 'JSON 输入';
  const targetLabel = direction === 'edn-to-json' ? 'JSON 输出' : 'EDN 输出';

  const markerColumns = [
    { title: 'EDN 形式', dataIndex: 'edn', key: 'edn' },
    { title: 'JSON 中的类型标记', dataIndex: 'json', key: 'json' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          value={direction}
          onChange={(event) => setDirection(event.target.value as ConvertDirection)}
          optionType="button"
          buttonStyle="solid"
          options={DIRECTIONS.map((item) => ({ label: item.label, value: item.value }))}
        />
        <Button icon={<SwapOutlined />} onClick={swapDirection}>
          换向并载入输出
        </Button>
        <Switch
          checked={compact}
          onChange={setCompact}
          checkedChildren="紧凑"
          unCheckedChildren="缩进"
        />
        <Button size="small" onClick={loadSample}>
          示例
        </Button>
      </div>

      <div className={styles.panels}>
        <Card
          title={sourceLabel}
          extra={
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          }
        >
          <Input.TextArea
            className={styles.editor}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoSize={{ minRows: 14, maxRows: 26 }}
            spellCheck={false}
            placeholder={direction === 'edn-to-json' ? '{:key "value"}' : '{"key": "value"}'}
          />
        </Card>

        <Card
          title={targetLabel}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {conversion.error ? (
            <Alert type="error" showIcon message="转换失败" description={conversion.error} />
          ) : conversion.output ? (
            <pre className={styles.mono} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {conversion.output}
            </pre>
          ) : (
            <span className={styles.hint}>输入内容后实时转换</span>
          )}
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message="EDN 与 JSON 的类型差异如何承载？"
        description={
          <div className={styles.hint}>
            <p>
              JSON 只有对象、数组、字符串、数字、布尔与 null，无法直接表达 EDN 的关键字、符号、集合、列表与
              #inst/#uuid 标签。本工具用 <code>___edn_type</code> 标记对象无损承载这些类型，换向时自动还原。
            </p>
            <Table
              style={{ marginTop: 8 }}
              rowKey="edn"
              size="small"
              pagination={false}
              columns={markerColumns}
              dataSource={MARKER_REFERENCE as unknown as Record<string, string>[]}
            />
          </div>
        }
      />

      <Space>
        <span className={styles.hint}>
          全部解析与序列化均在浏览器本地完成，数据不会离开设备。
        </span>
      </Space>
    </div>
  );
};

export default EdnJsonConverter;
