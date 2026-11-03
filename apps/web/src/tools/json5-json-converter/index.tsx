'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { parseJson5, stringifyJson5 } from './utils/json5';
import { DEFAULT_JSON, DEFAULT_JSON5, Json5ModeEnum } from './constants';
import styles from './index.module.css';

/**
 * 递归检测值树中是否含 NaN / Infinity（标准 JSON 无法表达）
 *
 * @param value - 待检测值
 * @param seen - 已访问对象，防止循环
 * @returns 是否含非有限数字
 */
function containsNonFinite(value: unknown, seen: WeakSet<object> = new WeakSet()): boolean {
  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    if (Array.isArray(value)) {
      return value.some((item) => containsNonFinite(item, seen));
    }
    return Object.values(value).some((item) => containsNonFinite(item, seen));
  }
  return false;
}

/**
 * JSON5 ↔ JSON 双向转换器。JSON5 → JSON 方向用零依赖手写解析器
 * 支持注释、单引号、未加引号键、尾逗号、十六进制、Infinity/NaN 等；
 * JSON → JSON5 方向输出可直接粘贴进 JS/TS 配置的友好写法。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns JSON5 转换交互界面
 */
const Json5JsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Json5ModeEnum>(Json5ModeEnum.JSON5_TO_JSON);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_JSON5);

  const result = React.useMemo<{ output: string; error: string | null; notice: string | null }>(() => {
    if (!input.trim()) {
      return { output: '', error: null, notice: null };
    }
    if (mode === Json5ModeEnum.JSON5_TO_JSON) {
      const parsed = parseJson5(input);
      if (parsed.error !== null) {
        return { output: '', error: parsed.error, notice: null };
      }
      // Infinity / NaN 在标准 JSON 中不可表达：JSON.stringify 会输出 null，先检测并提示
      const notice = containsNonFinite(parsed.output)
        ? '输入中包含 Infinity/NaN，标准 JSON 不支持该字面量，已按 null 输出；如需保留请使用 JSON → JSON5 方向。'
        : null;
      let jsonText: string;
      try {
        jsonText = JSON.stringify(parsed.output, null, 2);
      } catch (error) {
        return { output: '', error: `无法序列化为标准 JSON：${(error as Error).message}`, notice: null };
      }
      return { output: jsonText, error: null, notice };
    }

    let jsonValue: unknown;
    try {
      jsonValue = JSON.parse(input);
    } catch (error) {
      return { output: '', error: `标准 JSON 解析失败：${(error as Error).message}`, notice: null };
    }
    const serialized = stringifyJson5(jsonValue, { indent: 2, singleQuotes: true });
    if (serialized.error !== null) {
      return { output: '', error: serialized.error, notice: null };
    }
    return { output: serialized.output, error: null, notice: null };
  }, [mode, input]);

  /**
   * 切换方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: Json5ModeEnum): void => {
    setMode(next);
    setInput(next === Json5ModeEnum.JSON5_TO_JSON ? DEFAULT_JSON5 : DEFAULT_JSON);
  };

  /**
   * 复制结果
   */
  const handleCopy = async (): Promise<void> => {
    if (!result.output) {
      return;
    }
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  const isToJson = mode === Json5ModeEnum.JSON5_TO_JSON;

  return (
    <div className={styles.container}>
      <Card title="JSON5 ↔ JSON 双向转换器（配置文件 / TS 对象字面量友好）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as Json5ModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: 'JSON5 / JSONC → 标准 JSON', value: Json5ModeEnum.JSON5_TO_JSON },
              { label: 'JSON → JSON5 友好写法', value: Json5ModeEnum.JSON_TO_JSON5 },
            ]}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isToJson ? DEFAULT_JSON5 : DEFAULT_JSON)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.label} style={{ marginTop: 12 }}>
          {isToJson ? 'JSON5 输入（支持注释、单引号、尾逗号、十六进制等）：' : '标准 JSON 输入：'}
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          autoSize={{ minRows: 9, maxRows: 22 }}
          spellCheck={false}
          style={{ marginTop: 8, fontFamily: 'monospace' }}
        />
      </Card>

      <Card
        title={isToJson ? '标准 JSON 结果' : 'JSON5 友好写法（可直接粘贴进 JS / TS）'}
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={Boolean(result.error) || !result.output}
          >
            复制结果
          </Button>
        }
      >
        {result.error ? (
          <Alert
            type="error"
            showIcon
            message={isToJson ? 'JSON5 解析失败' : '转换失败'}
            description={result.error}
          />
        ) : (
          <Input.TextArea value={result.output} readOnly autoSize={{ minRows: 8, maxRows: 20 }} />
        )}
        {result.notice ? (
          <Alert type="warning" showIcon message={result.notice} style={{ marginTop: 12 }} />
        ) : null}
        <div className={styles.hint}>
          JSON5 是 JSON 的超集：键可不加引号、字符串可用单引号、允许 // 与块注释、尾逗号、
          0x 十六进制、.5 前导小数点、+/-Infinity 与 NaN；转换全部在浏览器本地完成，解析器为零依赖手写实现。
        </div>
      </Card>
    </div>
  );
};

export default Json5JsonConverter;
