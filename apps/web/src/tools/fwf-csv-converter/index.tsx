'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Radio, Space, Switch, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import {
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { csvToFwf, fwfToCsv, type FwfColumn } from './utils/fwfCsv';
import {
  DEFAULT_COLUMNS,
  DEFAULT_CSV_SAMPLE,
  DEFAULT_FWF_SAMPLE,
  FwfDirectionEnum,
  HINT,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 列定义编辑草稿：宽度允许为空（null），转换时按 0 处理并由纯函数报错
 */
interface ColumnDraft {
  /** 列名 */
  name: string;
  /** 列宽（正整数） */
  width: number | null;
  /** 对齐方式 */
  align: 'left' | 'right';
}

/**
 * 把默认列定义转为编辑草稿
 *
 * @param columns - 列定义
 * @returns 可编辑草稿数组
 */
function toDrafts(columns: FwfColumn[]): ColumnDraft[] {
  return columns.map((column) => ({ ...column }));
}

/**
 * 把编辑草稿转为纯函数所需列定义；宽度为空时记为 0，由校验返回错误
 *
 * @param drafts - 编辑草稿
 * @returns 列定义
 */
function toColumns(drafts: ColumnDraft[]): FwfColumn[] {
  return drafts.map((draft) => ({
    name: draft.name,
    width: draft.width ?? 0,
    align: draft.align,
  }));
}

/**
 * 固定列宽文本 FWF ↔ CSV 双向转换工具，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns FWF ↔ CSV 交互界面
 */
const FwfCsvConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<FwfDirectionEnum>(
    FwfDirectionEnum.CSV_TO_FWF,
  );
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_CSV_SAMPLE);
  const [drafts, setDrafts] = React.useState<ColumnDraft[]>(() => toDrafts(DEFAULT_COLUMNS));
  const [overflow, setOverflow] = React.useState<'truncate' | 'error'>('truncate');
  const [newline, setNewline] = React.useState<'\r\n' | '\n'>('\r\n');
  const [hasHeader, setHasHeader] = React.useState<boolean>(true);

  const columns = React.useMemo(() => toColumns(drafts), [drafts]);

  const csvResult = React.useMemo(() => {
    if (direction !== FwfDirectionEnum.CSV_TO_FWF) return null;
    return csvToFwf(input, columns, { overflow, newline, hasHeader });
  }, [direction, input, columns, overflow, newline, hasHeader]);

  const fwfResult = React.useMemo(() => {
    if (direction !== FwfDirectionEnum.FWF_TO_CSV) return null;
    return fwfToCsv(input, columns, { newline, hasHeader });
  }, [direction, input, columns, newline, hasHeader]);

  const output = csvResult?.output ?? fwfResult?.output ?? '';
  const error = csvResult?.error ?? fwfResult?.error ?? null;
  const truncatedCount = csvResult?.truncatedCount ?? 0;
  const headers = fwfResult?.headers ?? [];
  const isCsvToFwf = direction === FwfDirectionEnum.CSV_TO_FWF;

  /**
   * 更新指定列的草稿字段
   *
   * @param index - 列序号
   * @param patch - 需要合并的字段
   */
  const updateDraft = (index: number, patch: Partial<ColumnDraft>) => {
    setDrafts((previous) =>
      previous.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...patch } : draft,
      ),
    );
  };

  /**
   * 追加一列，至少保留 1 列
   */
  const handleAddColumn = () => {
    setDrafts((previous) => [
      ...previous,
      { name: `column${previous.length + 1}`, width: 8, align: 'left' },
    ]);
  };

  /**
   * 删除指定列，仅剩 1 列时不允许删除
   *
   * @param index - 列序号
   */
  const handleRemoveColumn = (index: number) => {
    setDrafts((previous) =>
      previous.length <= 1 ? previous : previous.filter((_, draftIndex) => draftIndex !== index),
    );
  };

  /**
   * 填充内置示例列定义
   */
  const handleFillSampleColumns = () => {
    setDrafts(toDrafts(DEFAULT_COLUMNS));
  };

  /**
   * 切换转换方向并载入目标方向的示例输入
   *
   * @param nextDirection - 目标方向
   */
  const handleDirectionChange = (nextDirection: FwfDirectionEnum) => {
    setDirection(nextDirection);
    setInput(
      nextDirection === FwfDirectionEnum.CSV_TO_FWF ? DEFAULT_CSV_SAMPLE : DEFAULT_FWF_SAMPLE,
    );
  };

  /**
   * 重新载入当前方向的示例输入
   */
  const handleLoadSample = () => {
    setInput(isCsvToFwf ? DEFAULT_CSV_SAMPLE : DEFAULT_FWF_SAMPLE);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (error || !output) {
      message.error('暂无可复制的输出');
      return;
    }
    await copyToClipboard(output);
    message.success('已复制转换结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={direction}
          options={[
            { value: FwfDirectionEnum.CSV_TO_FWF, label: 'CSV → FWF' },
            { value: FwfDirectionEnum.FWF_TO_CSV, label: 'FWF → CSV' },
          ]}
          onChange={(event) =>
            handleDirectionChange(event.target.value as FwfDirectionEnum)
          }
        />
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title="列定义（列名 / 宽度 / 对齐）" size="small">
        <div className={styles.columns}>
          {drafts.map((draft, index) => (
            <div className={styles.columnRow} key={index}>
              <Input
                className={styles.columnName}
                size="small"
                placeholder="列名"
                value={draft.name}
                onChange={(event) => updateDraft(index, { name: event.target.value })}
              />
              <InputNumber
                className={styles.columnWidth}
                size="small"
                min={1}
                precision={0}
                placeholder="宽度"
                value={draft.width}
                onChange={(value) => updateDraft(index, { width: value })}
              />
              <Radio.Group
                size="small"
                optionType="button"
                value={draft.align}
                options={[
                  { value: 'left', label: '左对齐' },
                  { value: 'right', label: '右对齐' },
                ]}
                onChange={(event) =>
                  updateDraft(index, { align: event.target.value as 'left' | 'right' })
                }
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={drafts.length <= 1}
                onClick={() => handleRemoveColumn(index)}
              >
                删除
              </Button>
            </div>
          ))}
          <div className={styles.columnActions}>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddColumn}>
              添加列
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleFillSampleColumns}>
              填充示例列（name:10 left, age:5 right, city:12 left）
            </Button>
          </div>
        </div>
      </Card>

      <Card className={styles.card} title="转换选项" size="small">
        <div className={styles.options}>
          {isCsvToFwf && (
            <>
              <span>超长字段</span>
              <Radio.Group
                optionType="button"
                size="small"
                value={overflow}
                options={[
                  { value: 'truncate', label: '截断' },
                  { value: 'error', label: '报错' },
                ]}
                onChange={(event) =>
                  setOverflow(event.target.value as 'truncate' | 'error')
                }
              />
            </>
          )}
          <span>换行</span>
          <Radio.Group
            optionType="button"
            size="small"
            value={newline}
            options={[
              { value: '\n', label: 'LF (\\n)' },
              { value: '\r\n', label: 'CRLF (\\r\\n)' },
            ]}
            onChange={(event) => setNewline(event.target.value as '\r\n' | '\n')}
          />
          <span>首行作为表头</span>
          <Switch checked={hasHeader} onChange={setHasHeader} />
        </div>
      </Card>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={isCsvToFwf ? '输入 CSV' : '输入 FWF 定宽文本'}
          extra={
            <Space>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleLoadSample}>
                示例
              </Button>
              <Button size="small" icon={<ClearOutlined />} onClick={handleClear}>
                清空
              </Button>
            </Space>
          }
        >
          <TextArea
            className={styles.editor}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoSize={{ minRows: 14, maxRows: 24 }}
            spellCheck={false}
          />
        </Card>

        <Card
          className={styles.card}
          title={isCsvToFwf ? '输出 FWF 定宽文本' : '输出 CSV'}
          extra={
            <Button
              size="small"
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopy}
            >
              复制
            </Button>
          }
        >
          {error && (
            <Alert className={styles.notice} type="error" showIcon message={error} />
          )}
          {!error && isCsvToFwf && truncatedCount > 0 && (
            <Alert
              className={styles.notice}
              type="warning"
              showIcon
              message={`共有 ${truncatedCount} 个字段超出列宽，已按宽度截断`}
            />
          )}
          {!error && !isCsvToFwf && headers.length > 0 && (
            <div className={styles.notice}>
              <span className={styles.hint}>
                {hasHeader ? '表头（取自首行）：' : '表头（取自列名）：'}
                {headers.join(' | ')}
              </span>
            </div>
          )}
          <TextArea
            className={styles.editor}
            value={output}
            readOnly
            autoSize={{ minRows: 14, maxRows: 24 }}
            spellCheck={false}
          />
        </Card>
      </div>
    </div>
  );
};

export default FwfCsvConverter;
