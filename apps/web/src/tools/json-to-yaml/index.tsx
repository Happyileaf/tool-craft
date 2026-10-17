'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Input, Radio, Result, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { jsonToYaml } from './utils/converter';
import { DEFAULT_INDENT_SIZE, DEFAULT_JSON_SAMPLE, INDENT_SIZE_OPTIONS } from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * JSON 转 YAML 工具，实时将 JSON 文本转换为等效 YAML，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns JSON 转 YAML 交互界面
 */
const JsonToYaml: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [json, setJson] = React.useState<string>(defaultInput || DEFAULT_JSON_SAMPLE);
  const [indentSize, setIndentSize] = React.useState<number>(DEFAULT_INDENT_SIZE);
  const [yaml, setYaml] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  /**
   * 尝试把指定 JSON 文本转换为 YAML，失败时记录错误信息
   *
   * @param source - 待转换的 JSON 文本
   * @param size - 目标缩进宽度
   */
  const convert = React.useCallback((source: string, size: number) => {
    try {
      setYaml(jsonToYaml(source, { indentSize: size }));
      setError(null);
    } catch (caught) {
      setYaml('');
      setError(caught instanceof Error ? caught.message : 'JSON 解析失败');
    }
  }, []);

  React.useEffect(() => {
    convert(DEFAULT_JSON_SAMPLE, DEFAULT_INDENT_SIZE);
  }, [convert]);

  /**
   * JSON 输入变化时同步转换
   *
   * @param event - 文本域变更事件
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setJson(next);
    convert(next, indentSize);
  };

  /**
   * 缩进宽度变化时按新宽度重新转换
   *
   * @param size - 目标缩进宽度
   */
  const handleIndentChange = (size: number) => {
    setIndentSize(size);
    convert(json, size);
  };

  /**
   * 重新载入示例 JSON
   */
  const handleLoadSample = () => {
    setJson(DEFAULT_JSON_SAMPLE);
    convert(DEFAULT_JSON_SAMPLE, indentSize);
  };

  /**
   * 清空输入与输出
   */
  const handleClear = () => {
    setJson('');
    convert('', indentSize);
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (error) {
      message.error('当前 JSON 存在错误，无法复制');
      return;
    }
    await copyToClipboard(yaml);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <span>缩进宽度：</span>
          <Radio.Group
            value={indentSize}
            onChange={(event) => handleIndentChange(Number(event.target.value))}
            optionType="button"
            buttonStyle="solid"
          >
            {INDENT_SIZE_OPTIONS.map((size) => (
              <Radio.Button key={size} value={size}>
                {size} 空格
              </Radio.Button>
            ))}
          </Radio.Group>
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
            value={json}
            onChange={handleInputChange}
            placeholder="在这里输入或粘贴 JSON..."
            rows={14}
            autoSize={{ minRows: 10, maxRows: 24 }}
          />
        </Card>

        <Card
          title="输出 YAML"
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
            <Result status="error" title="JSON 解析错误" subTitle={error} />
          ) : (
            <Input.TextArea
              value={yaml}
              readOnly
              rows={14}
              autoSize={{ minRows: 10, maxRows: 24 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default JsonToYaml;
