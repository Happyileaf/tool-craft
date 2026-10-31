'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, message, Radio, Space, Table, Tag } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import {
  jsonToForm,
  formToJson,
  type NestStyle,
  type SpaceEncoding,
} from './utils/formurlencoded';
import { DEFAULT_JSON, DEFAULT_FORM, HINT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'json-to-form' | 'form-to-json';

const NEST_OPTIONS = [
  { value: 'bracket', label: '括号 a[0] / a[b]' },
  { value: 'php', label: 'PHP a[] / a[b]' },
  { value: 'dot', label: '点路径 a.b' },
];

const PARSE_NEST_OPTIONS = [
  { value: 'bracket', label: '括号 a[0] / a[b]' },
  { value: 'php', label: 'PHP a[] 追加' },
  { value: 'dot', label: '点路径 a.b' },
  { value: 'flat', label: '平铺（重复键为数组）' },
];

const JsonFormUrlencoded: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('json-to-form');
  const [jsonText, setJsonText] = React.useState(defaultInput || DEFAULT_JSON);
  const [formText, setFormText] = React.useState(DEFAULT_FORM);
  const [nestStyle, setNestStyle] = React.useState<NestStyle>('bracket');
  const [parseStyle, setParseStyle] = React.useState<'bracket' | 'php' | 'dot' | 'flat'>('bracket');
  const [space, setSpace] = React.useState<SpaceEncoding>('plus');

  const encodeResult = React.useMemo(() => {
    if (mode !== 'json-to-form') return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      return { output: '', pairs: [], error: `JSON 语法错误：${(e as Error).message}` };
    }
    return jsonToForm(parsed, { space, nestStyle });
  }, [mode, jsonText, space, nestStyle]);

  const parseResult = React.useMemo(() => {
    if (mode !== 'form-to-json') return null;
    return formToJson(formText, { nestStyle: parseStyle });
  }, [mode, formText, parseStyle]);

  const output =
    mode === 'json-to-form' ? encodeResult?.output ?? '' : parseResult?.output ?? '';
  const error = mode === 'json-to-form' ? encodeResult?.error ?? null : parseResult?.error ?? null;
  const pairs = mode === 'json-to-form' ? encodeResult?.pairs ?? [] : parseResult?.pairs ?? [];

  const handleSwap = () => {
    if (error || !output) {
      message.error('当前输出无效，无法交换');
      return;
    }
    if (mode === 'json-to-form') {
      setFormText(output);
      setParseStyle(nestStyle === 'dot' ? 'dot' : nestStyle === 'php' ? 'php' : 'bracket');
      setMode('form-to-json');
    } else {
      setJsonText(output);
      setMode('json-to-form');
    }
  };

  const handleCopy = () => {
    if (!output || error) {
      message.error('暂无可复制的输出');
      return;
    }
    copyToClipboard(output);
    message.success('已复制转换结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={[
            { value: 'json-to-form', label: 'JSON → x-www-form-urlencoded' },
            { value: 'form-to-json', label: 'x-www-form-urlencoded → JSON' },
          ]}
          onChange={(e) => setMode(e.target.value as Mode)}
        />
        <Tag color="blue">RFC 3986</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title="转换选项">
        <div className={styles.options}>
          {mode === 'json-to-form' ? (
            <>
              <span>嵌套风格</span>
              <Radio.Group
                optionType="button"
                size="small"
                value={nestStyle}
                options={NEST_OPTIONS}
                onChange={(e) => setNestStyle(e.target.value as NestStyle)}
              />
              <span>空格编码</span>
              <Radio.Group
                optionType="button"
                size="small"
                value={space}
                options={[
                  { value: 'plus', label: '空格 → +' },
                  { value: 'percent', label: '空格 → %20' },
                ]}
                onChange={(e) => setSpace(e.target.value as SpaceEncoding)}
              />
            </>
          ) : (
            <>
              <span>解析风格</span>
              <Radio.Group
                optionType="button"
                size="small"
                value={parseStyle}
                options={PARSE_NEST_OPTIONS}
                onChange={(e) =>
                  setParseStyle(e.target.value as 'bracket' | 'php' | 'dot' | 'flat')
                }
              />
              <span className={styles.hint}>+ 一律解码为空格</span>
            </>
          )}
        </div>
      </Card>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={mode === 'json-to-form' ? '输入 JSON 对象' : '输入 x-www-form-urlencoded 请求体'}
        >
          <TextArea
            className={styles.editor}
            value={mode === 'json-to-form' ? jsonText : formText}
            onChange={(e) =>
              mode === 'json-to-form' ? setJsonText(e.target.value) : setFormText(e.target.value)
            }
            autoSize={{ minRows: 14, maxRows: 24 }}
            spellCheck={false}
          />
        </Card>
        <Card
          className={styles.card}
          title={mode === 'json-to-form' ? '输出请求体' : '输出 JSON'}
          extra={
            <Space>
              <Button size="small" icon={<SwapOutlined />} onClick={handleSwap}>
                结果反向载入
              </Button>
              <Button size="small" type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
            </Space>
          }
        >
          {error ? (
            <Alert type="error" showIcon message={error} />
          ) : (
            <TextArea
              className={styles.editor}
              value={output}
              readOnly
              autoSize={{ minRows: 14, maxRows: 24 }}
              spellCheck={false}
            />
          )}
        </Card>
      </div>

      {pairs.length > 0 ? (
        <Card className={styles.card} title={`键值对预览（${pairs.length}）`} size="small">
          <Table
            className={styles.pairs}
            size="small"
            pagination={pairs.length > 10 ? { pageSize: 10 } : false}
            rowKey={(_, i) => String(i)}
            dataSource={pairs.map((p, i) => ({ key: i, name: p.key, value: p.value }))}
            columns={[
              { title: '键（已解码）', dataIndex: 'name', key: 'name', width: '40%' },
              { title: '值（已解码）', dataIndex: 'value', key: 'value' },
            ]}
          />
        </Card>
      ) : null}
    </div>
  );
};

export default JsonFormUrlencoded;
