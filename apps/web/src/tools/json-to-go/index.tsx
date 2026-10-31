'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Switch, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateGoStruct } from './utils/go-struct';
import {
  DEFAULT_OMITEMPTY,
  DEFAULT_ROOT_NAME,
  SAMPLE_OPTIONS,
  SIMPLE_SAMPLE,
} from './constants';
import styles from './index.module.css';

/**
 * JSON 转 Go struct 工具：实时解析输入的 JSON 文本并递归推断类型，
 * 生成带 json tag 的 Go struct 定义（嵌套对象提升为具名类型），
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 JSON 输入
 * @returns JSON → Go struct 交互界面
 */
const JsonToGo: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || SIMPLE_SAMPLE);
  const [rootName, setRootName] = React.useState<string>(DEFAULT_ROOT_NAME);
  const [omitempty, setOmitempty] = React.useState<boolean>(DEFAULT_OMITEMPTY);

  const { output, structCount, error } = React.useMemo(() => {
    try {
      const result = generateGoStruct(input, { structName: rootName, omitempty });
      return { output: result.output, structCount: result.structCount, error: null as string | null };
    } catch (caught) {
      return {
        output: '',
        structCount: 0,
        error: caught instanceof Error ? caught.message : '生成 Go struct 失败',
      };
    }
  }, [input, rootName, omitempty]);

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制生成的 Go 源码
   */
  const handleCopy = async () => {
    if (error || !output) {
      message.error('暂无可复制的结果');
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
            <span>根结构名</span>
            <Input
              value={rootName}
              onChange={(event) => setRootName(event.target.value)}
              placeholder={DEFAULT_ROOT_NAME}
              style={{ width: 160 }}
            />
          </Space>
          <Space size={4}>
            <span>omitempty</span>
            <Switch checked={omitempty} onChange={setOmitempty} />
          </Space>
          <span className={styles.meta}>
            {SAMPLE_OPTIONS.map((sample) => (
              <Button
                key={sample.label}
                size="small"
                type="link"
                style={{ padding: '0 4px' }}
                onClick={() => setInput(sample.value)}
              >
                {sample.label}
              </Button>
            ))}
          </span>
        </Space>
        <Space>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="输入 JSON" className={styles.card}>
          <Input.TextArea
            className={styles.code}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="在这里输入 JSON 文本..."
            autoSize={{ minRows: 16, maxRows: 28 }}
          />
        </Card>

        <Card
          title={
            <Space>
              生成的 Go Struct
              {!error && output ? <Tag color="blue">{structCount} 个类型</Tag> : null}
            </Space>
          }
          className={styles.card}
          extra={
            !error && output ? (
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            ) : null
          }
        >
          {error ? (
            <Alert type="error" showIcon message="无法生成 Go struct" description={error} />
          ) : (
            <Input.TextArea
              className={styles.code}
              value={output}
              readOnly
              autoSize={{ minRows: 16, maxRows: 28 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default JsonToGo;
