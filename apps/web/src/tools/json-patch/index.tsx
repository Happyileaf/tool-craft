'use client';

import React from 'react';
import { Alert, Button, Card, Input, Space, Tag } from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  ExperimentOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_DOCUMENT, DEFAULT_PATCH, ERROR_PATCH } from './constants';
import {
  applyJsonPatch,
  JsonParseError,
  parseJsonInput,
} from './utils/json-patch';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface ComputeState {
  output: string;
  applied: number;
  error: string | null;
}

/**
 * JSON Patch 工具：按 RFC 6902 顺序应用补丁数组。
 * 全部解析与运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为原文档）
 * @returns JSON Patch 交互界面
 */
const JsonPatch: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [documentText, setDocumentText] = React.useState<string>(
    defaultInput || DEFAULT_DOCUMENT,
  );
  const [patchText, setPatchText] = React.useState<string>(DEFAULT_PATCH);

  const state = React.useMemo<ComputeState>(() => {
    if (!documentText.trim() || !patchText.trim()) {
      return { output: '', applied: 0, error: null };
    }
    try {
      const document = parseJsonInput(documentText);
      const patch = parseJsonInput(patchText);
      const outcome = applyJsonPatch(document, patch);
      if ('error' in outcome) {
        return { output: '', applied: 0, error: outcome.error };
      }
      return {
        output: JSON.stringify(outcome.result, null, 2),
        applied: outcome.applied,
        error: null,
      };
    } catch (error) {
      if (error instanceof JsonParseError && error.line > 0) {
        return {
          output: '',
          applied: 0,
          error: `JSON 解析失败（第 ${error.line} 行第 ${error.column} 列）：${error.message}`,
        };
      }
      return {
        output: '',
        applied: 0,
        error: error instanceof Error ? error.message : '处理失败',
      };
    }
  }, [documentText, patchText]);

  /** 恢复官方示例 */
  const handleLoadSample = () => {
    setDocumentText(DEFAULT_DOCUMENT);
    setPatchText(DEFAULT_PATCH);
  };

  /** 载入一个含操作级错误的补丁用于演示错误定位 */
  const handleLoadErrorSample = () => {
    setDocumentText(DEFAULT_DOCUMENT);
    setPatchText(ERROR_PATCH);
  };

  /** 清空全部输入 */
  const handleClear = () => {
    setDocumentText('');
    setPatchText('');
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
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ExperimentOutlined />} onClick={handleLoadErrorSample}>
            错误示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="原文档" className={styles.card}>
          <Input.TextArea
            value={documentText}
            onChange={(event) => setDocumentText(event.target.value)}
            placeholder="在这里输入或粘贴原始 JSON 文档..."
            autoSize={{ minRows: 12, maxRows: 24 }}
            spellCheck={false}
            className={styles.editor}
          />
        </Card>

        <Card
          title="JSON Patch 操作数组（RFC 6902）"
          className={styles.card}
        >
          <Input.TextArea
            value={patchText}
            onChange={(event) => setPatchText(event.target.value)}
            placeholder='[{"op":"add","path":"/key","value":1}, ...]'
            autoSize={{ minRows: 12, maxRows: 24 }}
            spellCheck={false}
            className={styles.editor}
          />
        </Card>
      </div>

      <Card
        title="应用结果"
        className={styles.card}
        extra={
          !state.error && state.output ? (
            <Space>
              {state.applied > 0 ? (
                <Tag color="green">已应用 {state.applied} 个操作</Tag>
              ) : null}
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            </Space>
          ) : null
        }
      >
        {state.error ? (
          <Alert
            type="error"
            showIcon
            message="补丁应用失败"
            description={<span className={styles.errorText}>{state.error}</span>}
          />
        ) : state.output ? (
          <pre className={styles.result}>{state.output}</pre>
        ) : (
          <p className={styles.emptyHint}>
            在上方两栏填入 JSON 后，补丁将按顺序实时应用，结果显示在这里
          </p>
        )}
      </Card>

      <Alert
        className={styles.hint}
        type="info"
        showIcon
        message="RFC 6902 语义提示"
        description={
          <ul className={styles.hintList}>
            <li>
              支持 <code>add</code> / <code>remove</code> / <code>replace</code>{' '}
              / <code>move</code> / <code>copy</code> / <code>test</code>{' '}
              六个操作，按数组顺序依次应用。
            </li>
            <li>
              路径为 RFC 6901 JSON Pointer：<code>/a/b</code> 分段，
              <code>~1</code> 表示 <code>/</code>，<code>~0</code> 表示{' '}
              <code>~</code>，<code>-</code> 仅在 add 数组元素时表示末尾。
            </li>
            <li>
              <code>test</code> 断言失败、路径不存在、数组越界、op 未知等都会返回
              <strong>带操作序号的精确错误</strong>，且整个补丁不会产生部分结果。
            </li>
            <li>与 RFC 7386 Merge Patch 不同，本工具做路径级精确修改；所有运算均在本地完成。</li>
          </ul>
        }
      />
    </div>
  );
};

export default JsonPatch;
