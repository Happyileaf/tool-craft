'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, InputNumber, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  buildScaleTable,
  convertUnit,
  CssUnitEnum,
  formatUnit,
  isValidContext,
  type ScaleRow,
  type UnitContext,
} from './utils/css-unit';
import {
  DEFAULT_PARENT_FONT_SIZE,
  DEFAULT_ROOT_FONT_SIZE,
  DEFAULT_SOURCE_UNIT,
  DEFAULT_VALUE,
  UNIT_LABELS,
  UNIT_OPTIONS,
} from './constants';
import styles from './index.module.css';

/**
 * CSS 长度单位换算工具，在 px / rem / em / pt 之间实时互转；
 * 根字号与父级字号可自定义，同时给出常用 px 值对照表，全部运算在浏览器本地完成
 *
 * @returns CSS 单位换算交互界面
 */
const CssUnitConverter: React.FC<ToolComponentProps> = () => {
  const [value, setValue] = React.useState<number | null>(Number(DEFAULT_VALUE));
  const [sourceUnit, setSourceUnit] = React.useState<CssUnitEnum>(DEFAULT_SOURCE_UNIT);
  const [rootFontSize, setRootFontSize] = React.useState<number | null>(
    Number(DEFAULT_ROOT_FONT_SIZE),
  );
  const [parentFontSize, setParentFontSize] = React.useState<number | null>(
    Number(DEFAULT_PARENT_FONT_SIZE),
  );

  const ctx: UnitContext | null = React.useMemo(() => {
    if (rootFontSize === null || parentFontSize === null) {
      return null;
    }
    const candidate = { rootFontSize, parentFontSize };
    return isValidContext(candidate) ? candidate : null;
  }, [rootFontSize, parentFontSize]);

  const results = React.useMemo(() => {
    if (value === null || ctx === null) {
      return null;
    }
    const entries = (Object.values(CssUnitEnum) as CssUnitEnum[])
      .filter((unit) => unit !== sourceUnit)
      .map((unit) => ({ unit, value: convertUnit(value, sourceUnit, unit, ctx) }));
    return entries;
  }, [value, sourceUnit, ctx]);

  const scaleTable = React.useMemo(
    () => (ctx === null ? null : buildScaleTable(ctx)),
    [ctx],
  );

  const columns: ColumnsType<ScaleRow> = [
    { title: 'px', dataIndex: 'px', key: 'px', width: 120 },
    {
      title: 'rem',
      dataIndex: 'rem',
      key: 'rem',
      render: (cell: number) => <span className={styles.tableValue}>{formatUnit(cell)}</span>,
    },
    {
      title: 'em',
      dataIndex: 'em',
      key: 'em',
      render: (cell: number) => <span className={styles.tableValue}>{formatUnit(cell)}</span>,
    },
    {
      title: 'pt',
      dataIndex: 'pt',
      key: 'pt',
      render: (cell: number) => <span className={styles.tableValue}>{formatUnit(cell)}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="CSS 单位换算（px / rem / em / pt）">
        <div className={styles.row}>
          <span>输入数值</span>
          <InputNumber
            value={value}
            onChange={(next) => setValue(next)}
            style={{ width: 160 }}
            placeholder="请输入数字"
          />
          <Select
            value={sourceUnit}
            onChange={(next: CssUnitEnum) => setSourceUnit(next)}
            options={UNIT_OPTIONS}
            style={{ width: 220 }}
          />
        </div>

        <div className={styles.row} style={{ marginTop: 16 }}>
          <span>根字号（rem 基准）</span>
          <InputNumber
            value={rootFontSize}
            onChange={(next) => setRootFontSize(next)}
            addonAfter="px"
            min={0}
            style={{ width: 160 }}
          />
          <span>父级字号（em 基准）</span>
          <InputNumber
            value={parentFontSize}
            onChange={(next) => setParentFontSize(next)}
            addonAfter="px"
            min={0}
            style={{ width: 160 }}
          />
        </div>

        {value === null || ctx === null ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="请输入有效数值，并确保根字号与父级字号均为大于 0 的数字"
          />
        ) : (
          <div className={styles.resultGrid}>
            {results?.map((entry) => (
              <div key={entry.unit} className={styles.resultCard}>
                <div className={styles.resultLabel}>{UNIT_LABELS[entry.unit]}</div>
                <span className={styles.resultValue}>
                  {entry.value === null ? '—' : formatUnit(entry.value)}
                </span>
                <span className={styles.resultUnit}>{entry.unit}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="常用 px 值对照表">
        {scaleTable === null ? (
          <Alert
            type="warning"
            showIcon
            message="基准字号非法时无法生成对照表"
          />
        ) : (
          <Table<ScaleRow>
            columns={columns}
            dataSource={scaleTable}
            rowKey="px"
            pagination={false}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
};

export default CssUnitConverter;
