'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Segmented, Space, Switch, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { iniToJson, jsonToIni } from './utils/ini';
import {
  DIRECTION_INI_TO_JSON,
  DIRECTION_JSON_TO_INI,
  APP_SAMPLE,
  SAMPLE_OPTIONS,
} from './constants';
import styles from './index.module.css';

type Direction = typeof DIRECTION_INI_TO_JSON | typeof DIRECTION_JSON_TO_INI;

/**
 * INI 配置与 JSON 双向转换工具：支持类型推断、点号嵌套键、
 * 同名分节合并与中文错误定位。全部解析在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns INI ↔ JSON 双向转换界面
 */
const IniJsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<Direction>(DIRECTION_INI_TO_JSON);
  const [input, setInput] = React.useState<string>(defaultInput || APP_SAMPLE);
  const [inferTypes, setInferTypes] = React.useState<boolean>(true);
  const [dotSections, setDotSections] = React.useState<boolean>(false);

  const { output, error } = React.useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null as string | null };
    }
    try {
      if (direction === DIRECTION_INI_TO_JSON) {
        const parsed = iniToJson(input, { inferTypes, dotSections });
        return { output: JSON.stringify(parsed, null, 2), error: null as string | null };
      }
      return { output: jsonToIni(input), error: null as string | null };
    } catch (caught) {
      return {
        output: '',
        error: caught instanceof Error ? caught.message : '转换失败',
      };
    }
  }, [input, direction, inferTypes, dotSections]);

  const handleCopy = async () => {
    if (error || !output) {
      message.error('暂无可复制的结果');
      return;
    }
    await copyToClipboard(output);
    message.success('复制成功');
  };

  const inputTitle = direction === DIRECTION_INI_TO_JSON ? '输入 INI' : '输入 JSON';
  const outputTitle = direction === DIRECTION_INI_TO_JSON ? '输出 JSON' : '输出 INI';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap className={styles.options}>
          <Segmented
            value={direction}
            onChange={(value) => setDirection(value as Direction)}
            options={[
              { label: 'INI → JSON', value: DIRECTION_INI_TO_JSON },
              { label: 'JSON → INI', value: DIRECTION_JSON_TO_INI },
            ]}
          />
          {direction === DIRECTION_INI_TO_JSON ? (
            <Space size={16}>
              <Space size={4}>
                <Switch size="small" checked={inferTypes} onChange={setInferTypes} />
                <span className={styles.meta}>类型推断（布尔/数字/null）</span>
              </Space>
              <Space size={4}>
                <Switch size="small" checked={dotSections} onChange={setDotSections} />
                <span className={styles.meta}>点号嵌套键</span>
              </Space>
            </Space>
          ) : (
            <Tag color="default">仅支持一层嵌套（INI 单层分节限制）</Tag>
          )}
        </Space>
        <Space>
          {SAMPLE_OPTIONS.filter((sample) => sample.direction === direction).map((sample) => (
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
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title={inputTitle} className={styles.card}>
          <Input.TextArea
            className={styles.code}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              direction === DIRECTION_INI_TO_JSON
                ? '[section]\nkey = value'
                : '{"key": "value"}'
            }
            autoSize={{ minRows: 16, maxRows: 28 }}
          />
        </Card>

        <Card
          title={outputTitle}
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
            <Alert type="error" showIcon message="转换失败" description={error} />
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

export default IniJsonConverter;
