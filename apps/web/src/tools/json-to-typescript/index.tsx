'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, Switch, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { jsonToTypeScript } from './utils/infer';
import {
  DEFAULT_EXPORT_ROOT,
  DEFAULT_INDENT,
  DEFAULT_ROOT_NAME,
  DEFAULT_SAMPLE,
  INDENT_OPTIONS,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * JSON 转 TypeScript 类型工具，实时解析输入的 JSON 文本并递归推断类型，
 * 生成 interface / type 定义，全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 JSON 输入
 * @returns JSON → TypeScript 交互界面
 */
const JsonToTypeScript: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);
  const [rootName, setRootName] = React.useState<string>(DEFAULT_ROOT_NAME);
  const [indent, setIndent] = React.useState<number>(DEFAULT_INDENT);
  const [exportRoot, setExportRoot] = React.useState<boolean>(DEFAULT_EXPORT_ROOT);

  const { output, error } = React.useMemo(() => {
    try {
      const code = jsonToTypeScript(input, { rootName, indent, exportRoot });
      return { output: code, error: null as string | null };
    } catch (caught) {
      return {
        output: '',
        error: caught instanceof Error ? caught.message : '生成 TypeScript 类型失败',
      };
    }
  }, [input, rootName, indent, exportRoot]);

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 重新载入示例 JSON
   */
  const handleLoadSample = () => {
    setInput(DEFAULT_SAMPLE);
  };

  /**
   * 复制生成的 TypeScript 结果
   */
  const handleCopy = async () => {
    if (error) {
      message.error('存在解析错误，无法复制');
      return;
    }
    await copyToClipboard(output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap className={styles.options}>
          <Space size={4}>
            <span>根类型名</span>
            <Input
              value={rootName}
              onChange={(event) => setRootName(event.target.value)}
              placeholder={DEFAULT_ROOT_NAME}
              style={{ width: 140 }}
            />
          </Space>
          <Space size={4}>
            <span>缩进</span>
            <Select
              value={indent}
              onChange={setIndent}
              options={INDENT_OPTIONS.map((value) => ({ label: `${value} 空格`, value }))}
              style={{ width: 110 }}
            />
          </Space>
          <Space size={4}>
            <span>导出根类型</span>
            <Switch checked={exportRoot} onChange={setExportRoot} />
          </Space>
        </Space>
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
        <Card title="输入 JSON" className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="在这里输入 JSON 文本..."
            autoSize={{ minRows: 14, maxRows: 26 }}
          />
        </Card>

        <Card
          title="生成的 TypeScript"
          className={styles.card}
          extra={
            !error && (
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            )
          }
        >
          {error ? (
            <Alert type="error" showIcon message="JSON 解析失败" description={error} />
          ) : (
            <Input.TextArea
              className={styles.code}
              value={output}
              readOnly
              autoSize={{ minRows: 14, maxRows: 26 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default JsonToTypeScript;
