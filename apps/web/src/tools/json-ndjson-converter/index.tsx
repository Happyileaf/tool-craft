'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Input, Radio, Result, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { jsonToNdjson, ndjsonToJson } from './utils/ndjson';
import {
  DEFAULT_JSON_SAMPLE,
  DEFAULT_NDJSON_SAMPLE,
  NdjsonDirectionEnum,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * 取指定转换方向的示例输入
 *
 * @param direction - 转换方向
 * @returns 对应方向的示例文本
 */
function sampleOf(direction: NdjsonDirectionEnum): string {
  return direction === NdjsonDirectionEnum.JSON_TO_NDJSON
    ? DEFAULT_JSON_SAMPLE
    : DEFAULT_NDJSON_SAMPLE;
}

/**
 * JSON 数组 ↔ JSON Lines（NDJSON）互转工具，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns JSON ↔ NDJSON 交互界面
 */
const JsonNdjsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<NdjsonDirectionEnum>(
    NdjsonDirectionEnum.JSON_TO_NDJSON,
  );
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_JSON_SAMPLE);
  const [output, setOutput] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  /**
   * 按当前方向执行一次转换
   *
   * @param source - 待转换文本
   * @param nextDirection - 转换方向
   */
  const convert = React.useCallback((source: string, nextDirection: NdjsonDirectionEnum) => {
    try {
      const result =
        nextDirection === NdjsonDirectionEnum.JSON_TO_NDJSON
          ? jsonToNdjson(source)
          : ndjsonToJson(source);
      setOutput(result);
      setError(null);
    } catch (caught) {
      setOutput('');
      setError(caught instanceof Error ? caught.message : '转换失败');
    }
  }, []);

  React.useEffect(() => {
    convert(DEFAULT_JSON_SAMPLE, NdjsonDirectionEnum.JSON_TO_NDJSON);
  }, [convert]);

  /**
   * 输入内容变化时同步转换
   *
   * @param event - 文本域变更事件
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setInput(next);
    convert(next, direction);
  };

  /**
   * 切换转换方向并按新方向的示例重置输入
   *
   * @param nextDirection - 目标转换方向
   */
  const handleDirectionChange = (nextDirection: NdjsonDirectionEnum) => {
    setDirection(nextDirection);
    const nextSample = sampleOf(nextDirection);
    setInput(nextSample);
    convert(nextSample, nextDirection);
  };

  /**
   * 重新载入当前方向的示例输入
   */
  const handleLoadSample = () => {
    const nextSample = sampleOf(direction);
    setInput(nextSample);
    convert(nextSample, direction);
  };

  /**
   * 清空输入与输出
   */
  const handleClear = () => {
    setInput('');
    convert('', direction);
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (error) {
      message.error('存在转换错误，无法复制');
      return;
    }
    await copyToClipboard(output);
    message.success('复制成功');
  };

  const isJsonToNdjson = direction === NdjsonDirectionEnum.JSON_TO_NDJSON;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          value={direction}
          onChange={(event) => handleDirectionChange(event.target.value as NdjsonDirectionEnum)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value={NdjsonDirectionEnum.JSON_TO_NDJSON}>
            JSON 数组 → NDJSON
          </Radio.Button>
          <Radio.Button value={NdjsonDirectionEnum.NDJSON_TO_JSON}>
            NDJSON → JSON 数组
          </Radio.Button>
        </Radio.Group>
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
        <Card
          title={isJsonToNdjson ? '输入 JSON 数组' : '输入 NDJSON（每行一个 JSON）'}
          className={styles.card}
        >
          <Input.TextArea
            value={input}
            onChange={handleInputChange}
            placeholder={
              isJsonToNdjson
                ? '在这里输入 JSON 数组...'
                : '每行一个独立 JSON 值，例如 {"id":1,"name":"Alice"}'
            }
            rows={14}
            autoSize={{ minRows: 10, maxRows: 24 }}
          />
          {!isJsonToNdjson && (
            <div className={styles.hint}>
              JSON Lines 规范：每行必须是一个完整、紧凑的 JSON 值，不支持跨行对象；空行会被忽略。
            </div>
          )}
        </Card>

        <Card
          title={isJsonToNdjson ? '输出 NDJSON' : '输出 JSON 数组'}
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
            <Result status="error" title="转换错误" subTitle={error} />
          ) : (
            <Input.TextArea
              value={output}
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

export default JsonNdjsonConverter;
