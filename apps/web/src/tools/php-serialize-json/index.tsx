'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { parsePhpSerialize, serializeToPhp } from './utils/php-serialize';
import { DEFAULT_JSON, DEFAULT_PHP, PhpModeEnum } from './constants';
import styles from './index.module.css';

/**
 * PHP serialize() 文本与 JSON 双向转换工具。
 * 反序列化方向把 PHP 文本解析为 JSON 预览（索引数组与关联数组以
 * $$phpObject$$ 标记对象区分）；序列化方向把合法 JSON 转为 PHP 文本，
 * JS 数组输出索引数组、对象输出关联数组。全部解析在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns PHP serialize 转换交互界面
 */
const PhpSerializeJson: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<PhpModeEnum>(PhpModeEnum.DESERIALIZE);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_PHP);

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) {
      return { output: '', error: null };
    }
    if (mode === PhpModeEnum.DESERIALIZE) {
      const parsed = parsePhpSerialize(input);
      if (parsed.error !== null) {
        return { output: '', error: parsed.error };
      }
      return { output: JSON.stringify(parsed.output, null, 2), error: null };
    }
    let jsonValue: unknown;
    try {
      jsonValue = JSON.parse(input);
    } catch (error) {
      return { output: '', error: `JSON 解析失败：${(error as Error).message}` };
    }
    const serialized = serializeToPhp(jsonValue);
    return { output: serialized.output, error: serialized.error };
  }, [mode, input]);

  /**
   * 切换方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: PhpModeEnum): void => {
    setMode(next);
    setInput(next === PhpModeEnum.DESERIALIZE ? DEFAULT_PHP : DEFAULT_JSON);
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

  const isDeserialize = mode === PhpModeEnum.DESERIALIZE;

  return (
    <div className={styles.container}>
      <Card title="PHP serialize ↔ JSON 双向转换器（Laravel 缓存 / 老系统数据迁移）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as PhpModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: 'PHP serialize → JSON', value: PhpModeEnum.DESERIALIZE },
              { label: 'JSON → PHP serialize', value: PhpModeEnum.SERIALIZE },
            ]}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isDeserialize ? DEFAULT_PHP : DEFAULT_JSON)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.label} style={{ marginTop: 12 }}>
          {isDeserialize ? 'PHP serialize 输入：' : 'JSON 输入：'}
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isDeserialize ? '如 a:2:{s:1:"a";i:1;s:1:"b";s:1:"x";}' : '输入合法 JSON'}
          autoSize={{ minRows: 7, maxRows: 18 }}
          spellCheck={false}
          style={{ marginTop: 8, fontFamily: 'monospace' }}
        />
      </Card>

      <Card
        title={isDeserialize ? 'JSON 预览（数组以标记对象区分 list / assoc）' : 'PHP serialize 结果'}
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
            message={isDeserialize ? 'PHP 反序列化失败' : 'PHP 序列化失败'}
            description={result.error}
          />
        ) : (
          <Input.TextArea value={result.output} readOnly autoSize={{ minRows: 7, maxRows: 18 }} />
        )}
        <div className={styles.hint}>
          {isDeserialize
            ? 'PHP 数组以 { "$$phpObject$$": true, "$$phpArrayKind$$": "array|assoc", "data": ... } 标记对象呈现，以区分索引数组与关联数组；对象（O:）与资源类型不支持，会给出明确错误。'
            : 'JS 数组输出为 a:n:{i:0;...} 索引数组，普通对象输出为字符串键关联数组；字符串长度按 UTF-16 码元计数，含分号、引号的内容按长度声明二进制安全写入。'}
        </div>
      </Card>
    </div>
  );
};

export default PhpSerializeJson;
