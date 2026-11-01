'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Select, Space, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  generateTable,
  type ColumnAlign,
  type DelimiterKind,
  type TableResult,
} from './utils/markdown-table';
import {
  ALIGN_LABEL,
  ALIGN_OPTIONS,
  DEFAULT_ALIGN,
  DEFAULT_DELIMITER,
  DEFAULT_SAMPLE,
  DELIMITER_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Markdown 表格生成器：把 CSV / TSV / Excel 粘贴内容转换为 GFM 管道表格，
 * 支持表头开关、逐列对齐、空格补齐与竖线转义，全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Markdown 表格生成器交互界面
 */
const MarkdownTableGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);
  const [delimiter, setDelimiter] = React.useState<DelimiterKind>(DEFAULT_DELIMITER);
  const [hasHeader, setHasHeader] = React.useState<boolean>(true);
  const [padded, setPadded] = React.useState<boolean>(true);
  const [escapePipes, setEscapePipes] = React.useState<boolean>(true);
  const [align, setAlign] = React.useState<ColumnAlign[]>(DEFAULT_ALIGN);

  /** 当前生成结果或错误信息 */
  const outcome = React.useMemo<{ result?: TableResult; error?: string }>(() => {
    try {
      return {
        result: generateTable(input, { hasHeader, align, padded, escapePipes, delimiter }),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [input, hasHeader, align, padded, escapePipes, delimiter]);

  const columnCount = outcome.result?.columnCount ?? 0;

  /** 对齐数组始终覆盖当前列数 */
  const effectiveAlign = React.useMemo<ColumnAlign[]>(
    () =>
      Array.from({ length: columnCount }, (_, index) =>
        index < align.length && align[index] ? align[index] : 'left',
      ),
    [columnCount, align],
  );

  /**
   * 更新某一列的对齐方式
   *
   * @param index - 列索引
   * @param value - 新对齐方式
   */
  const updateAlign = (index: number, value: ColumnAlign) => {
    setAlign((previous) => {
      const next = [...effectiveAlign];
      next[index] = value;
      return next;
    });
  };

  /**
   * 一键设置全部列为同一种对齐
   *
   * @param value - 目标对齐方式
   */
  const applyAlignToAll = (value: ColumnAlign) => {
    setAlign(Array.from({ length: Math.max(columnCount, 1) }, () => value));
  };

  return (
    <div className={styles.container}>
      <div className={styles.panelGrid}>
        <Card
          title="输入数据（CSV / TSV / 从 Excel 复制）"
          extra={
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          }
        >
          <Input.TextArea
            className={styles.textarea}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'在此粘贴表格数据，例如：\n名称\t评分\nJSON 格式化器\t4.8'}
            spellCheck={false}
          />

          <div className={styles.optionBlock}>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>分隔格式</span>
              <Select
                size="small"
                value={delimiter}
                onChange={setDelimiter}
                options={DELIMITER_OPTIONS}
                style={{ width: 240 }}
              />
            </div>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>首行作为表头</span>
              <Switch checked={hasHeader} onChange={setHasHeader} size="small" />
            </div>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>补齐对齐空格</span>
              <Switch checked={padded} onChange={setPadded} size="small" />
            </div>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>转义内容竖线（| → \|）</span>
              <Switch checked={escapePipes} onChange={setEscapePipes} size="small" />
            </div>
          </div>

          {columnCount > 0 ? (
            <div className={styles.optionBlock}>
              <div className={styles.optionRow}>
                <span className={styles.optionLabel}>批量对齐</span>
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  onChange={(event) => applyAlignToAll(event.target.value as ColumnAlign)}
                  options={ALIGN_OPTIONS}
                />
              </div>
              <div className={styles.alignGrid}>
                {effectiveAlign.map((columnAlign, index) => (
                  <div key={index} className={styles.alignItem}>
                    <Tag className={styles.alignTag}>第 {index + 1} 列</Tag>
                    <Select
                      size="small"
                      value={columnAlign}
                      onChange={(value: ColumnAlign) => updateAlign(index, value)}
                      options={ALIGN_OPTIONS}
                      style={{ width: 96 }}
                    />
                    <span className={styles.alignHint}>{ALIGN_LABEL[columnAlign]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card
          title="生成的 Markdown 表格"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              disabled={!outcome.result}
              onClick={() => {
                if (!outcome.result) return;
                copyToClipboard(outcome.result.markdown);
                message.success('Markdown 已复制');
              }}
            >
              复制
            </Button>
          }
        >
          {outcome.error ? (
            <Alert type="warning" showIcon message="无法生成" description={outcome.error} />
          ) : (
            <>
              <pre className={styles.output}>{outcome.result?.markdown}</pre>
              <Space wrap size={[8, 8]}>
                <Tag color="blue">{columnCount} 列</Tag>
                <Tag color="green">{outcome.result?.dataRowCount} 行数据</Tag>
                {outcome.result && outcome.result.paddedRows.length > 0 ? (
                  <Tag color="orange">
                    第 {outcome.result.paddedRows.join('、')} 行列数不足，已自动补空列
                  </Tag>
                ) : null}
              </Space>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MarkdownTableGenerator;
