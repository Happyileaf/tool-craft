'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Input, Radio, Result, Select, Space, Switch, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { csvToJson, jsonToCsv } from './utils/csv';
import {
  CsvDirectionEnum,
  DEFAULT_CSV_SAMPLE,
  DEFAULT_DELIMITER,
  DEFAULT_JSON_SAMPLE,
  DELIMITER_OPTIONS,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * 取指定转换方向的示例输入
 *
 * @param direction - 转换方向
 * @returns 对应方向的示例文本
 */
function sampleOf(direction: CsvDirectionEnum): string {
  return direction === CsvDirectionEnum.CSV_TO_JSON
    ? DEFAULT_CSV_SAMPLE
    : DEFAULT_JSON_SAMPLE;
}

/**
 * CSV ↔ JSON 转换工具，支持双向转换、分隔符选择与表头开关，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns CSV ↔ JSON 交互界面
 */
const CsvJsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<CsvDirectionEnum>(
    CsvDirectionEnum.CSV_TO_JSON,
  );
  const [delimiter, setDelimiter] = React.useState<string>(DEFAULT_DELIMITER);
  const [hasHeader, setHasHeader] = React.useState<boolean>(true);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_CSV_SAMPLE);
  const [output, setOutput] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  /**
   * 按当前选项执行一次转换
   *
   * @param source - 待转换文本
   * @param nextDirection - 转换方向
   * @param nextDelimiter - 字段分隔符
   * @param nextHasHeader - 是否把首行作为表头
   */
  const convert = React.useCallback(
    (
      source: string,
      nextDirection: CsvDirectionEnum,
      nextDelimiter: string,
      nextHasHeader: boolean,
    ) => {
      try {
        const result =
          nextDirection === CsvDirectionEnum.CSV_TO_JSON
            ? csvToJson(source, {
                delimiter: nextDelimiter,
                hasHeader: nextHasHeader,
              })
            : jsonToCsv(source, { delimiter: nextDelimiter });
        setOutput(result);
        setError(null);
      } catch (caught) {
        setOutput('');
        setError(caught instanceof Error ? caught.message : '转换失败');
      }
    },
    [],
  );

  React.useEffect(() => {
    convert(DEFAULT_CSV_SAMPLE, CsvDirectionEnum.CSV_TO_JSON, DEFAULT_DELIMITER, true);
  }, [convert]);

  /**
   * 输入内容变化时同步转换
   *
   * @param event - 文本域变更事件
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setInput(next);
    convert(next, direction, delimiter, hasHeader);
  };

  /**
   * 切换转换方向并按新方向的示例重置输入
   *
   * @param nextDirection - 目标转换方向
   */
  const handleDirectionChange = (nextDirection: CsvDirectionEnum) => {
    setDirection(nextDirection);
    const nextSample = sampleOf(nextDirection);
    setInput(nextSample);
    convert(nextSample, nextDirection, delimiter, hasHeader);
  };

  /**
   * 切换字段分隔符并按新分隔符重新转换
   *
   * @param nextDelimiter - 目标字段分隔符
   */
  const handleDelimiterChange = (nextDelimiter: string) => {
    setDelimiter(nextDelimiter);
    convert(input, direction, nextDelimiter, hasHeader);
  };

  /**
   * 切换表头开关并按新开关重新转换
   *
   * @param nextHasHeader - 目标表头开关状态
   */
  const handleHeaderChange = (nextHasHeader: boolean) => {
    setHasHeader(nextHasHeader);
    convert(input, direction, delimiter, nextHasHeader);
  };

  /**
   * 重新载入当前方向的示例输入
   */
  const handleLoadSample = () => {
    const nextSample = sampleOf(direction);
    setInput(nextSample);
    convert(nextSample, direction, delimiter, hasHeader);
  };

  /**
   * 清空输入与输出
   */
  const handleClear = () => {
    setInput('');
    convert('', direction, delimiter, hasHeader);
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

  const isCsvToJson = direction === CsvDirectionEnum.CSV_TO_JSON;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Radio.Group
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value as CsvDirectionEnum)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value={CsvDirectionEnum.CSV_TO_JSON}>CSV → JSON</Radio.Button>
            <Radio.Button value={CsvDirectionEnum.JSON_TO_CSV}>JSON → CSV</Radio.Button>
          </Radio.Group>
          <span>分隔符：</span>
          <Select
            value={delimiter}
            onChange={handleDelimiterChange}
            options={DELIMITER_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            style={{ width: 160 }}
          />
          {isCsvToJson && (
            <Space size={4}>
              <span>首行作为表头</span>
              <Switch checked={hasHeader} onChange={handleHeaderChange} />
            </Space>
          )}
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
        <Card title={isCsvToJson ? '输入 CSV' : '输入 JSON'} className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={handleInputChange}
            placeholder={isCsvToJson ? '在这里输入 CSV 文本...' : '在这里输入 JSON 数组...'}
            rows={14}
            autoSize={{ minRows: 10, maxRows: 24 }}
          />
        </Card>

        <Card
          title={isCsvToJson ? '输出 JSON' : '输出 CSV'}
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

export default CsvJsonConverter;
