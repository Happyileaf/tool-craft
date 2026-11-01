'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Select, Space, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  jsonToStrings,
  parseStrings,
  stringsToJson,
  type StringsDirection,
} from './utils/strings';
import { DEFAULT_JSON_SAMPLE, DEFAULT_STRINGS_SAMPLE, DUPLICATE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 转换结果 */
interface ConvertResult {
  output: string;
  count: number;
  comments: string[];
}

/**
 * Apple .strings ↔ JSON 双向转换器：
 * 解析 Localizable.strings 的 C 注释、转义、\U 编码与重复键，
 * 或把 JSON 文案对象生成为标准 .strings，全部运算在浏览器本地完成。
 *
 * @returns .strings ↔ JSON 转换界面
 */
const StringsJsonConverter: React.FC<ToolComponentProps> = () => {
  const [direction, setDirection] = React.useState<StringsDirection>('strings-to-json');
  const [input, setInput] = React.useState<string>(DEFAULT_STRINGS_SAMPLE);
  const [duplicateKey, setDuplicateKey] = React.useState<'error' | 'last' | 'first'>('error');
  const [sortKeys, setSortKeys] = React.useState<boolean>(false);

  /** 当前转换结果（含错误信息） */
  const outcome = React.useMemo<{ result?: ConvertResult; error?: string }>(() => {
    try {
      if (direction === 'strings-to-json') {
        const parsed = parseStrings(input, { duplicateKey });
        return {
          result: {
            output: stringsToJson(input, { duplicateKey }),
            count: parsed.count,
            comments: parsed.comments,
          },
        };
      }
      const generated = jsonToStrings(input, { sortKeys, indent: true });
      return { result: { output: generated.text, count: generated.count, comments: [] } };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [direction, input, duplicateKey, sortKeys]);

  /**
   * 切换方向并载入对应示例
   *
   * @param next - 目标转换方向
   */
  const switchDirection = (next: StringsDirection) => {
    setDirection(next);
    setInput(next === 'strings-to-json' ? DEFAULT_STRINGS_SAMPLE : DEFAULT_JSON_SAMPLE);
  };

  const inputTitle = direction === 'strings-to-json' ? '输入 .strings' : '输入 JSON 对象';
  const outputTitle = direction === 'strings-to-json' ? '输出 JSON' : '输出 .strings';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={direction}
          onChange={(event) => switchDirection(event.target.value as StringsDirection)}
          options={[
            { label: '.strings → JSON', value: 'strings-to-json' },
            { label: 'JSON → .strings', value: 'json-to-strings' },
          ]}
        />
        {direction === 'strings-to-json' ? (
          <Space size={8}>
            <span className={styles.toolLabel}>重复键</span>
            <Select
              size="small"
              value={duplicateKey}
              onChange={setDuplicateKey}
              options={DUPLICATE_OPTIONS}
              style={{ width: 132 }}
            />
          </Space>
        ) : (
          <Space size={8}>
            <span className={styles.toolLabel}>按键排序</span>
            <Switch checked={sortKeys} onChange={setSortKeys} size="small" />
          </Space>
        )}
      </div>

      <div className={styles.panelGrid}>
        <Card
          title={inputTitle}
          extra={
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          }
        >
          <Input.TextArea
            className={styles.textarea}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder={direction === 'strings-to-json' ? '"key" = "value";' : '{ "key": "value" }'}
          />
        </Card>

        <Card
          title={outputTitle}
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              disabled={!outcome.result}
              onClick={() => {
                if (!outcome.result) return;
                copyToClipboard(outcome.result.output);
                message.success('已复制到剪贴板');
              }}
            >
              复制
            </Button>
          }
        >
          {outcome.error ? (
            <Alert type="error" showIcon message="转换失败" description={outcome.error} />
          ) : (
            <>
              <pre className={styles.output}>{outcome.result?.output}</pre>
              <Space wrap size={[8, 8]}>
                <Tag color="blue">{outcome.result?.count} 个键值对</Tag>
                {outcome.result && outcome.result.comments.length > 0 ? (
                  <Tag color="default">已剥离 {outcome.result.comments.length} 条注释</Tag>
                ) : null}
              </Space>
            </>
          )}
        </Card>
      </div>

      <Alert
        className={styles.note}
        type="info"
        showIcon
        message="格式说明"
        description={
          direction === 'strings-to-json'
            ? '支持 // 与 /* */ C 风格注释（自动剥离并计数）、\n \t \" \\ \0 与 \\Uxxxx / \\Uxxxxxxxx 转义、跨行键值；缺分号、未闭合引号、重复键等错误会给出所在行号。'
            : '仅接受顶层为对象、所有值均为字符串的 JSON；特殊字符自动转义，emoji 以 8 位 \\U 码点输出，中文等普通 Unicode 原样保留。不支持 .stringsdict、.xcstrings 与二进制 plist。'
        }
      />
    </div>
  );
};

export default StringsJsonConverter;
