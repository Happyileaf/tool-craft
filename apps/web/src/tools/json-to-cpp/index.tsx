'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { jsonToCpp } from './utils/cpp';
import {
  DEFAULT_EMPTY_ARRAY_STRATEGY,
  DEFAULT_INDENT,
  DEFAULT_NAMESPACE,
  DEFAULT_ROOT_NAME,
  DEFAULT_SAMPLE,
  EMPTY_ARRAY_OPTIONS,
  INDENT_OPTIONS,
  type EmptyArrayStrategy,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * JSON 转 C++ struct 工具，实时解析输入的 JSON 文本并递归推断类型，
 * 生成 C++17 struct 定义与告警列表，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 JSON 输入
 * @returns JSON → C++ 交互界面
 */
const JsonToCpp: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);
  const [rootName, setRootName] = React.useState<string>(DEFAULT_ROOT_NAME);
  const [namespaceName, setNamespaceName] = React.useState<string>(DEFAULT_NAMESPACE);
  const [indent, setIndent] = React.useState<number>(DEFAULT_INDENT);
  const [emptyArrayType, setEmptyArrayType] = React.useState<EmptyArrayStrategy>(
    DEFAULT_EMPTY_ARRAY_STRATEGY,
  );

  const { output, warnings, error } = React.useMemo(() => {
    try {
      const result = jsonToCpp(input, {
        rootName,
        namespace: namespaceName,
        indent,
        emptyArrayType,
      });
      return { output: result.code, warnings: result.warnings, error: null as string | null };
    } catch (caught) {
      return {
        output: '',
        warnings: [] as string[],
        error: caught instanceof Error ? caught.message : '生成 C++ 代码失败',
      };
    }
  }, [input, rootName, namespaceName, indent, emptyArrayType]);

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
   * 复制生成的 C++ 结果
   */
  const handleCopy = async () => {
    if (error || output === '') {
      message.error('暂无可复制的代码');
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
            <span>根名称</span>
            <Input
              value={rootName}
              onChange={(event) => setRootName(event.target.value)}
              placeholder={DEFAULT_ROOT_NAME}
              style={{ width: 120 }}
            />
          </Space>
          <Space size={4}>
            <span>命名空间</span>
            <Input
              value={namespaceName}
              onChange={(event) => setNamespaceName(event.target.value)}
              placeholder="留空则不包裹"
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
            <span>空数组</span>
            <Select<EmptyArrayStrategy>
              value={emptyArrayType}
              onChange={setEmptyArrayType}
              options={EMPTY_ARRAY_OPTIONS}
              style={{ width: 190 }}
            />
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
          title="生成的 C++17 代码"
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
            <>
              {warnings.length > 0 ? (
                <div className={styles.warnings}>
                  {warnings.map((warning) => (
                    <Tag key={warning} color="orange">
                      {warning}
                    </Tag>
                  ))}
                </div>
              ) : null}
              <Input.TextArea
                className={styles.code}
                value={output}
                readOnly
                autoSize={{ minRows: 14, maxRows: 26 }}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default JsonToCpp;
