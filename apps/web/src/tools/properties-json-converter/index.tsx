'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { parseProperties, stringifyProperties } from './utils/properties';
import {
  DEFAULT_JSON,
  DEFAULT_PROPERTIES,
  HINT,
  MODE_OPTIONS,
  PropertiesModeEnum,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Java .properties 与扁平 JSON 双向转换工具：
 * properties → JSON 解析续行 / 转义 / 注释，JSON → properties 序列化转义与续行，
 * 全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns properties ↔ JSON 转换界面
 */
const PropertiesJsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<PropertiesModeEnum>(PropertiesModeEnum.TO_JSON);
  const [propertiesText, setPropertiesText] = React.useState<string>(
    defaultInput || DEFAULT_PROPERTIES,
  );
  const [jsonText, setJsonText] = React.useState<string>(DEFAULT_JSON);

  /** properties → JSON 方向的解析结果 */
  const parseResult = React.useMemo(() => {
    if (mode !== PropertiesModeEnum.TO_JSON) {
      return null;
    }
    const result = parseProperties(propertiesText);
    return {
      output: result.data ? JSON.stringify(result.data, null, 2) : '',
      error: result.error,
      count: result.data ? Object.keys(result.data).length : 0,
    };
  }, [mode, propertiesText]);

  /** JSON → properties 方向的序列化结果 */
  const stringifyResult = React.useMemo(() => {
    if (mode !== PropertiesModeEnum.TO_PROPERTIES) {
      return null;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      return { output: '', error: `JSON 语法错误：${(e as Error).message}`, count: 0 };
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        output: '',
        error: 'JSON 顶层必须是对象（{ … }），不能是数组、字符串或裸值',
        count: 0,
      };
    }
    const result = stringifyProperties(parsed as Record<string, unknown>);
    return {
      output: result.text ?? '',
      error: result.error,
      count: Object.keys(parsed as Record<string, unknown>).length,
    };
  }, [mode, jsonText]);

  const active = mode === PropertiesModeEnum.TO_JSON ? parseResult : stringifyResult;
  const output = active?.output ?? '';
  const error = active?.error ?? null;
  const count = active?.count ?? 0;

  /**
   * 切换方向并载入该方向示例
   */
  const handleModeChange = (next: PropertiesModeEnum) => {
    setMode(next);
    if (next === PropertiesModeEnum.TO_JSON && propertiesText === '') {
      setPropertiesText(DEFAULT_PROPERTIES);
    }
    if (next === PropertiesModeEnum.TO_PROPERTIES && jsonText === '') {
      setJsonText(DEFAULT_JSON);
    }
  };

  /**
   * 把当前有效输出送入对侧输入并翻转方向，便于往返校验
   */
  const handleSwap = () => {
    if (error || !output) {
      message.error('当前输出无效，无法交换到对侧');
      return;
    }
    if (mode === PropertiesModeEnum.TO_JSON) {
      setJsonText(output);
      setMode(PropertiesModeEnum.TO_PROPERTIES);
    } else {
      setPropertiesText(output);
      setMode(PropertiesModeEnum.TO_JSON);
    }
  };

  /**
   * 复制输出结果
   */
  const handleCopy = async () => {
    if (!output || error) {
      return;
    }
    await copyToClipboard(output);
    message.success('复制成功');
  };

  const isToJson = mode === PropertiesModeEnum.TO_JSON;

  return (
    <div className={styles.container}>
      <Card
        title="Java .properties ↔ JSON 双向转换"
        extra={
          <Space>
            <Button
              icon={<SwapOutlined />}
              onClick={handleSwap}
              disabled={Boolean(error) || !output}
            >
              输出送入对侧并换向
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                isToJson
                  ? setPropertiesText(DEFAULT_PROPERTIES)
                  : setJsonText(DEFAULT_JSON)
              }
            >
              载入示例
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={() => (isToJson ? setPropertiesText('') : setJsonText(''))}
            >
              清空
            </Button>
          </Space>
        }
      >
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as PropertiesModeEnum)}
            options={MODE_OPTIONS}
            optionType="button"
            buttonStyle="solid"
          />
          <Tag color="blue">{count} 个键</Tag>
        </div>
        <div className={styles.hint}>{HINT}</div>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.card} title={isToJson ? '.properties 输入' : 'JSON 输入'}>
          {isToJson ? (
            <>
              <span className={styles.label}>.properties 配置文本：</span>
              <Input.TextArea
                value={propertiesText}
                onChange={(event) => setPropertiesText(event.target.value)}
                placeholder="粘贴 key=value / key:value / key value 风格配置"
                autoSize={{ minRows: 12, maxRows: 22 }}
                style={{ fontFamily: 'monospace' }}
              />
            </>
          ) : (
            <>
              <span className={styles.label}>扁平 JSON 对象：</span>
              <Input.TextArea
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                placeholder='{"key": "value"}（仅支持扁平字符串值）'
                autoSize={{ minRows: 12, maxRows: 22 }}
                style={{ fontFamily: 'monospace' }}
              />
            </>
          )}
        </Card>

        <Card
          className={styles.card}
          title={isToJson ? 'JSON 输出' : '.properties 输出'}
          extra={
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={Boolean(error) || !output}
            >
              复制结果
            </Button>
          }
        >
          {error ? (
            <Alert type="error" showIcon message="转换失败" description={error} />
          ) : (
            <Input.TextArea
              value={output}
              readOnly
              autoSize={{ minRows: 12, maxRows: 22 }}
              style={{ fontFamily: 'monospace' }}
            />
          )}
          <div className={styles.hint}>
            {isToJson
              ? '输出为扁平对象，重复键以后出现者为准；键中的 \\=、\\: 与 \\空格 转义会被还原。'
              : '键中的空格 / = / : 与值中的换行、制表、反斜杠均被转义；逻辑行超过 72 字符自动以反斜杠续行。'}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PropertiesJsonConverter;
