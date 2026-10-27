'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_ORIGINAL,
  DEFAULT_PATCH,
  DEFAULT_TARGET,
  MODE_OPTIONS,
  ModeEnum,
} from './constants';
import { applyPatch, generatePatch, parseJson } from './utils/mergePatch';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface ComputeState {
  output: string;
  error: string | null;
}

/**
 * JSON Merge Patch 工具：按 RFC 7386 / 7396 语义应用或生成 merge patch。
 * 全部解析与运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为原文档）
 * @returns JSON Merge Patch 交互界面
 */
const JsonMergePatch: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<ModeEnum>(ModeEnum.APPLY);
  const [originalText, setOriginalText] = React.useState<string>(
    defaultInput || DEFAULT_ORIGINAL,
  );
  const [secondaryText, setSecondaryText] = React.useState<string>(DEFAULT_PATCH);

  const state = React.useMemo<ComputeState>(() => {
    if (!originalText.trim() || !secondaryText.trim()) {
      return { output: '', error: null };
    }
    try {
      const original = parseJson(originalText);
      const secondary = parseJson(secondaryText);
      const result =
        mode === ModeEnum.APPLY
          ? applyPatch(original, secondary)
          : generatePatch(original, secondary);
      return { output: JSON.stringify(result, null, 2), error: null };
    } catch (error) {
      const caught = error as { message?: string; line?: number; column?: number };
      if (typeof caught.line === 'number') {
        return {
          output: '',
          error: `第 ${caught.line} 行第 ${caught.column ?? 1} 列：${caught.message ?? 'JSON 解析失败'}`,
        };
      }
      return { output: '', error: caught.message ?? '处理失败' };
    }
  }, [mode, originalText, secondaryText]);

  /**
   * 切换模式并载入对应示例。
   *
   * @param next - 目标模式
   */
  const handleModeChange = (next: ModeEnum) => {
    setMode(next);
    setOriginalText(DEFAULT_ORIGINAL);
    setSecondaryText(next === ModeEnum.APPLY ? DEFAULT_PATCH : DEFAULT_TARGET);
  };

  /** 载入当前模式的官方示例 */
  const handleLoadSample = () => {
    setOriginalText(DEFAULT_ORIGINAL);
    setSecondaryText(mode === ModeEnum.APPLY ? DEFAULT_PATCH : DEFAULT_TARGET);
  };

  /** 清空全部输入 */
  const handleClear = () => {
    setOriginalText('');
    setSecondaryText('');
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

  const secondaryLabel = mode === ModeEnum.APPLY ? 'Merge Patch（补丁文档）' : '目标文档';
  const resultLabel = mode === ModeEnum.APPLY ? '应用结果' : '生成的 Merge Patch';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          value={mode}
          onChange={(event) => handleModeChange(event.target.value as ModeEnum)}
          optionType="button"
          buttonStyle="solid"
          options={MODE_OPTIONS}
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
        <Card title="原文档" className={styles.card}>
          <Input.TextArea
            value={originalText}
            onChange={(event) => setOriginalText(event.target.value)}
            placeholder="在这里输入或粘贴原文档 JSON..."
            autoSize={{ minRows: 12, maxRows: 24 }}
            spellCheck={false}
            className={styles.editor}
          />
        </Card>

        <Card title={secondaryLabel} className={styles.card}>
          <Input.TextArea
            value={secondaryText}
            onChange={(event) => setSecondaryText(event.target.value)}
            placeholder={
              mode === ModeEnum.APPLY
                ? '输入要应用的 merge patch，null 表示删除键...'
                : '输入期望得到的目标文档 JSON...'
            }
            autoSize={{ minRows: 12, maxRows: 24 }}
            spellCheck={false}
            className={styles.editor}
          />
        </Card>
      </div>

      <Card
        title={resultLabel}
        className={styles.card}
        extra={
          !state.error && state.output ? (
            <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
              复制结果
            </Button>
          ) : null
        }
      >
        {state.error ? (
          <Alert type="error" showIcon message="JSON 解析失败" description={state.error} />
        ) : state.output ? (
          <pre className={styles.result}>{state.output}</pre>
        ) : (
          <p className={styles.emptyHint}>在上方两栏填入 JSON 后，结果将实时显示在这里</p>
        )}
      </Card>

      <Alert
        className={styles.hint}
        type="info"
        showIcon
        message="RFC 7386 语义提示"
        description={
          <ul className={styles.hintList}>
            <li>补丁中值为 <code>null</code> 表示删除目标对象的对应键；要把值更新为 null 无法用 merge patch 表达。</li>
            <li>数组整体替换，不按索引或元素合并；补丁为数组 / 标量 / null 时整体替换原文档。</li>
            <li>需要路径级增删改（如插入数组元素）应使用 JSON Patch（RFC 6902），本工具仅支持 merge patch。</li>
            <li>所有解析与运算均在你的浏览器本地完成，输入内容不会上传。</li>
          </ul>
        }
      />
    </div>
  );
};

export default JsonMergePatch;
