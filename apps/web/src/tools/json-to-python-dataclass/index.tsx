'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Switch, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generatePythonDataclass, type OutputStyle } from './utils/python-dataclass';
import {
  DEFAULT_CLASS_NAME,
  DEFAULT_HELPERS,
  SAMPLE_OPTIONS,
  SIMPLE_SAMPLE,
} from './constants';
import styles from './index.module.css';

/**
 * JSON 转 Python dataclass 工具：实时解析输入的 JSON 文本并递归推断类型，
 * 生成 @dataclass 或 TypedDict 定义（嵌套对象提升为具名类），
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 JSON 输入
 * @returns JSON → Python dataclass 交互界面
 */
const JsonToPythonDataclass: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || SIMPLE_SAMPLE);
  const [className, setClassName] = React.useState<string>(DEFAULT_CLASS_NAME);
  const [style, setStyle] = React.useState<OutputStyle>('dataclass');
  const [helpers, setHelpers] = React.useState<boolean>(DEFAULT_HELPERS);

  const { output, classCount, error } = React.useMemo(() => {
    try {
      const result = generatePythonDataclass(input, { className, style, helpers });
      return { output: result.output, classCount: result.classCount, error: null as string | null };
    } catch (caught) {
      return {
        output: '',
        classCount: 0,
        error: caught instanceof Error ? caught.message : '生成 Python 代码失败',
      };
    }
  }, [input, className, style, helpers]);

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制生成的 Python 源码
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
            <span>根类名</span>
            <Input
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder={DEFAULT_CLASS_NAME}
              style={{ width: 160 }}
            />
          </Space>
          <Space size={4}>
            <span>输出风格</span>
            <Radio.Group
              value={style}
              onChange={(event) => setStyle(event.target.value as OutputStyle)}
              optionType="button"
              buttonStyle="solid"
              size="small"
              options={[
                { label: '@dataclass', value: 'dataclass' },
                { label: 'TypedDict', value: 'typeddict' },
              ]}
            />
          </Space>
          {style === 'dataclass' ? (
            <Space size={4}>
              <span>from_dict / to_dict</span>
              <Switch checked={helpers} onChange={setHelpers} />
            </Space>
          ) : null}
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
              生成的 Python {style === 'dataclass' ? 'dataclass' : 'TypedDict'}
              {!error && output ? <Tag color="blue">{classCount} 个类</Tag> : null}
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
            <Alert type="error" showIcon message="无法生成 Python 代码" description={error} />
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

export default JsonToPythonDataclass;
