'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Tag } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_DOCUMENT, STYLE_OPTIONS } from './constants';
import type { CaseStyle, JsonValue } from './utils/key-case';
import { convertJsonKeys } from './utils/key-case';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface ComputeState {
  output: string;
  changedKeys: number;
  error: string | null;
  parseError: string | null;
}

/**
 * JSON 键名命名风格批量转换工具：递归转换全部对象键，保留值与层级。
 * 全部解析与运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为待转换 JSON）
 * @returns 键名风格转换交互界面
 */
const JsonKeyCase: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [style, setStyle] = React.useState<CaseStyle>('camel');
  const [inputText, setInputText] = React.useState<string>(
    defaultInput || DEFAULT_DOCUMENT,
  );

  const state = React.useMemo<ComputeState>(() => {
    if (!inputText.trim()) {
      return { output: '', changedKeys: 0, error: null, parseError: null };
    }
    let document: JsonValue;
    try {
      document = JSON.parse(inputText) as JsonValue;
    } catch (error) {
      return {
        output: '',
        changedKeys: 0,
        error: null,
        parseError: error instanceof Error ? error.message : 'JSON 解析失败',
      };
    }
    const outcome = convertJsonKeys(document, style);
    if ('error' in outcome) {
      return { output: '', changedKeys: 0, error: outcome.error, parseError: null };
    }
    return {
      output: JSON.stringify(outcome.result, null, 2),
      changedKeys: outcome.changedKeys,
      error: null,
      parseError: null,
    };
  }, [inputText, style]);

  /** 恢复默认示例 */
  const handleLoadSample = () => {
    setInputText(DEFAULT_DOCUMENT);
  };

  /** 清空输入 */
  const handleClear = () => {
    setInputText('');
  };

  /** 复制结果 JSON */
  const handleCopy = async () => {
    if (!state.output) {
      return;
    }
    try {
      await copyToClipboard(state.output);
      message.success('已复制结果 JSON');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          value={style}
          onChange={(event) => setStyle(event.target.value as CaseStyle)}
          optionType="button"
          buttonStyle="solid"
          options={STYLE_OPTIONS}
        />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="原始 JSON" className={styles.card}>
          <Input.TextArea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="在这里输入或粘贴待转换的 JSON..."
            autoSize={{ minRows: 14, maxRows: 26 }}
            spellCheck={false}
            className={styles.editor}
          />
        </Card>

        <Card
          title="转换结果"
          className={styles.card}
          extra={
            !state.error && !state.parseError && state.output ? (
              <Space>
                <Tag color="blue">已转换 {state.changedKeys} 个键</Tag>
                <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                  复制结果
                </Button>
              </Space>
            ) : null
          }
        >
          {state.parseError ? (
            <Alert
              type="error"
              showIcon
              message="JSON 解析失败"
              description={state.parseError}
            />
          ) : state.error ? (
            <Alert
              type="error"
              showIcon
              message="键名冲突，无法转换"
              description={<span className={styles.errorText}>{state.error}</span>}
            />
          ) : state.output ? (
            <pre className={styles.result}>{state.output}</pre>
          ) : (
            <p className={styles.emptyHint}>
              输入 JSON 并选择目标命名风格后，结果将实时显示在这里
            </p>
          )}
        </Card>
      </div>

      <Alert
        className={styles.hint}
        type="info"
        showIcon
        message="转换规则提示"
        description={
          <ul className={styles.hintList}>
            <li>
              递归处理所有嵌套对象与数组，<strong>仅修改键名</strong>
              ，数据值（包括字符串内容）与层级结构原样保留。
            </li>
            <li>
              识别 camelCase、PascalCase、snake_case、SCREAMING_SNAKE_CASE、
              kebab-case 以及连续大写缩写（如 <code>HTMLElement</code>）与数字边界。
            </li>
            <li>
              同一对象内不同原键转换后若变成相同键名（如 <code>user_id</code> 与{' '}
              <code>userId</code>），会报告<strong>含路径的撞键错误</strong>
              ，此时请先在源数据中消歧。
            </li>
            <li>所有解析与运算均在你的浏览器本地完成，输入内容不会上传。</li>
          </ul>
        }
      />
    </div>
  );
};

export default JsonKeyCase;
