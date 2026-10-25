'use client';

import React from 'react';
import { Button, Card, Checkbox, Input, Radio, Result, Select, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  LANGUAGE_JS,
  escapeString,
  stripQuotes,
  unescapeString,
  type EscapeLanguage,
} from './utils/escape';
import {
  DEFAULT_ESCAPED_SAMPLE,
  DEFAULT_RAW_SAMPLE,
  DIRECTION_ESCAPE,
  DIRECTION_UNESCAPE,
  LANGUAGE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 转换方向类型 */
type Direction = typeof DIRECTION_ESCAPE | typeof DIRECTION_UNESCAPE;

/**
 * 字符串字面量转义 / 反转义工具：在多行原始文本与
 * JavaScript / JSON、Python、Java 字符串字面量内容之间双向转换。
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 字符串转义交互界面
 */
const StringEscape: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<Direction>(DIRECTION_ESCAPE);
  const [language, setLanguage] = React.useState<EscapeLanguage>(LANGUAGE_JS);
  const [wrapQuotes, setWrapQuotes] = React.useState<boolean>(true);
  const [stripOuterQuotes, setStripOuterQuotes] = React.useState<boolean>(true);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_RAW_SAMPLE);

  const conversion = React.useMemo(() => {
    if (direction === DIRECTION_ESCAPE) {
      const body = escapeString(input, language);
      return { output: wrapQuotes ? `"${body}"` : body, error: null as string | null };
    }
    const source = stripOuterQuotes ? stripQuotes(input) : input;
    const result = unescapeString(source, language);
    return { output: result.text ?? '', error: result.error };
  }, [direction, input, language, wrapQuotes, stripOuterQuotes]);

  /**
   * 切换方向时载入对应示例
   *
   * @param next - 目标方向
   */
  const handleDirectionChange = (next: Direction) => {
    setDirection(next);
    setInput(next === DIRECTION_ESCAPE ? DEFAULT_RAW_SAMPLE : DEFAULT_ESCAPED_SAMPLE);
  };

  /** 复制转换结果 */
  const handleCopy = async () => {
    if (conversion.error || !conversion.output) {
      return;
    }
    try {
      await copyToClipboard(conversion.output);
      message.success('已复制转换结果');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const inputTitle = direction === DIRECTION_ESCAPE ? '输入原始文本' : '输入转义后的字面量内容';
  const outputTitle =
    direction === DIRECTION_ESCAPE ? '输出字符串字面量' : '输出还原文本';
  const languageHint =
    LANGUAGE_OPTIONS.find((option) => option.value === language)?.hint ?? '';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Radio.Group
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value as Direction)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value={DIRECTION_ESCAPE}>转义 Escape</Radio.Button>
            <Radio.Button value={DIRECTION_UNESCAPE}>反转义 Unescape</Radio.Button>
          </Radio.Group>
          <Space>
            <span>语言</span>
            <Select
              value={language}
              onChange={setLanguage}
              style={{ width: 180 }}
              options={LANGUAGE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </Space>
          {direction === DIRECTION_ESCAPE ? (
            <Checkbox checked={wrapQuotes} onChange={(event) => setWrapQuotes(event.target.checked)}>
              结果包裹双引号
            </Checkbox>
          ) : (
            <Checkbox
              checked={stripOuterQuotes}
              onChange={(event) => setStripOuterQuotes(event.target.checked)}
            >
              自动剥离成对外层引号
            </Checkbox>
          )}
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              setInput(direction === DIRECTION_ESCAPE ? DEFAULT_RAW_SAMPLE : DEFAULT_ESCAPED_SAMPLE)
            }
          >
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title={inputTitle} className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="在这里输入或粘贴文本..."
            autoSize={{ minRows: 12, maxRows: 26 }}
            spellCheck={false}
          />
        </Card>

        <Card
          title={outputTitle}
          className={styles.card}
          extra={
            !conversion.error && conversion.output ? (
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            ) : null
          }
        >
          {conversion.error ? (
            <Result status="error" title="转换失败" subTitle={conversion.error} />
          ) : (
            <Input.TextArea
              value={conversion.output}
              readOnly
              placeholder="转换结果将实时显示在这里"
              autoSize={{ minRows: 12, maxRows: 26 }}
              spellCheck={false}
            />
          )}
        </Card>
      </div>

      <p className={styles.hint}>
        {languageHint}。转义把换行、制表符、引号、反斜杠及非 ASCII 字符转换为代码可安全嵌入的序列，
        反转义则把日志或源码中的转义串还原为可读明文；处理均在浏览器本地完成，文本不会离开本机。
      </p>
    </div>
  );
};

export default StringEscape;
