'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  Space,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  applyLineOperations,
  FilterActionEnum,
  FilterModeEnum,
  SortModeEnum,
  SortOrderEnum,
  type LineOperationOptions,
  type LineOperationResult,
} from './utils/lines';
import {
  DEFAULT_INPUT,
  FILTER_ACTION_OPTIONS,
  FILTER_MODE_OPTIONS,
  SORT_MODE_OPTIONS,
  SORT_ORDER_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 行级文本处理工具，对多行文本执行排序、去重、反转与过滤等行级操作，
 * 全部运算在浏览器本地完成，纯函数处理，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 行级操作交互界面
 */
const LineOperations: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [sortMode, setSortMode] = React.useState<SortModeEnum>(SortModeEnum.NONE);
  const [order, setOrder] = React.useState<SortOrderEnum>(SortOrderEnum.ASC);
  const [dedupe, setDedupe] = React.useState(false);
  const [reverse, setReverse] = React.useState(false);
  const [trimLines, setTrimLines] = React.useState(false);
  const [removeEmpty, setRemoveEmpty] = React.useState(false);
  const [caseSensitive, setCaseSensitive] = React.useState(true);
  const [filterMode, setFilterMode] = React.useState<FilterModeEnum>(
    FilterModeEnum.NONE,
  );
  const [filterKeyword, setFilterKeyword] = React.useState('');
  const [filterAction, setFilterAction] = React.useState<FilterActionEnum>(
    FilterActionEnum.KEEP,
  );

  const result = React.useMemo<LineOperationResult>(() => {
    const options: LineOperationOptions = {
      sortMode,
      order,
      dedupe,
      caseSensitive,
      reverse,
      trimLines,
      removeEmpty,
      filterMode,
      filterKeyword,
      filterAction,
    };
    return applyLineOperations(input, options);
  }, [
    input,
    sortMode,
    order,
    dedupe,
    caseSensitive,
    reverse,
    trimLines,
    removeEmpty,
    filterMode,
    filterKeyword,
    filterAction,
  ]);

  /**
   * 载入默认示例文本
   */
  const handleLoadSample = () => {
    setInput(DEFAULT_INPUT);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制处理结果
   */
  const handleCopy = async () => {
    if (!result.output) {
      return;
    }
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.field}>
          <span className={styles.label}>排序：</span>
          <Select
            value={sortMode}
            onChange={setSortMode}
            options={SORT_MODE_OPTIONS}
            style={{ width: 110 }}
          />
          <Select
            value={order}
            onChange={setOrder}
            options={SORT_ORDER_OPTIONS}
            style={{ width: 90 }}
          />
        </div>

        <Space wrap>
          <Checkbox checked={dedupe} onChange={(e) => setDedupe(e.target.checked)}>
            去重
          </Checkbox>
          <Checkbox checked={reverse} onChange={(e) => setReverse(e.target.checked)}>
            反转行序
          </Checkbox>
          <Checkbox
            checked={trimLines}
            onChange={(e) => setTrimLines(e.target.checked)}
          >
            去除行首尾空白
          </Checkbox>
          <Checkbox
            checked={removeEmpty}
            onChange={(e) => setRemoveEmpty(e.target.checked)}
          >
            移除空行
          </Checkbox>
          <Checkbox
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          >
            区分大小写
          </Checkbox>
        </Space>

        <div className={styles.field}>
          <Select
            value={filterMode}
            onChange={setFilterMode}
            options={FILTER_MODE_OPTIONS}
            style={{ width: 140 }}
          />
          <Input
            value={filterKeyword}
            onChange={(event) => setFilterKeyword(event.target.value)}
            placeholder="关键字或正则"
            disabled={filterMode === FilterModeEnum.NONE}
            style={{ width: 180 }}
          />
          <Select
            value={filterAction}
            onChange={setFilterAction}
            options={FILTER_ACTION_OPTIONS}
            disabled={filterMode === FilterModeEnum.NONE}
            style={{ width: 130 }}
          />
        </div>

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
        <Card title="输入文本" className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴多行文本，每行一条记录"
            rows={16}
            autoSize={{ minRows: 12, maxRows: 24 }}
          />
        </Card>

        <Card
          title="处理结果"
          className={styles.card}
          extra={
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!result.output}
            >
              复制结果
            </Button>
          }
        >
          {result.error ? (
            <Alert type="error" showIcon message="处理失败" description={result.error} />
          ) : (
            <Input.TextArea
              value={result.output}
              readOnly
              rows={16}
              autoSize={{ minRows: 12, maxRows: 24 }}
            />
          )}
          <div className={styles.stats}>
            处理前 {result.inputCount} 行 · 处理后 {result.outputCount} 行
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LineOperations;
