'use client';

import React from 'react';
import { Alert, Card, InputNumber, Radio, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_COST,
  DEFAULT_SALVAGE,
  DEFAULT_TOTAL_UNITS,
  DEFAULT_UNITS_TEXT,
  DEFAULT_YEARS,
  METHOD_OPTIONS,
  formatCurrency,
} from './constants';
import {
  doubleDeclining,
  straightLine,
  sumOfYearsDigits,
  unitsOfActivity,
  validateBaseInputs,
  type DepreciationMethod,
  type DepreciationRow,
} from './utils/depreciation';
import styles from './index.module.css';

/** 表格行（带 Table 需要的 key） */
interface TableRow extends DepreciationRow {
  key: number;
}

/**
 * 固定资产折旧计算器：四种折旧方法切换，输出逐年 / 逐期折旧明细表，全部本地运算
 *
 * @returns 折旧计算交互界面
 */
const FixedAssetDepreciationCalculator: React.FC<ToolComponentProps> = () => {
  const [method, setMethod] = React.useState<DepreciationMethod>('straight-line');
  const [cost, setCost] = React.useState<number | null>(DEFAULT_COST);
  const [salvage, setSalvage] = React.useState<number | null>(DEFAULT_SALVAGE);
  const [years, setYears] = React.useState<number | null>(DEFAULT_YEARS);
  const [totalUnits, setTotalUnits] = React.useState<number | null>(DEFAULT_TOTAL_UNITS);
  const [unitsText, setUnitsText] = React.useState<string>(DEFAULT_UNITS_TEXT);

  const costValue = cost ?? 0;
  const salvageValue = salvage ?? 0;
  const yearsValue = years ?? 0;
  const totalUnitsValue = totalUnits ?? 0;

  /** 工作量法：解析各期工作量文本 */
  const unitsPerPeriod = React.useMemo(() => {
    return unitsText
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter((part) => part !== '')
      .map((part) => Number(part));
  }, [unitsText]);

  /** 计算结果与错误信息 */
  const { result, error } = React.useMemo(() => {
    const baseError = validateBaseInputs(costValue, salvageValue, yearsValue);
    if (baseError !== null && method !== 'units-of-activity') {
      return { result: null, error: baseError };
    }
    try {
      switch (method) {
        case 'straight-line':
          return { result: straightLine(costValue, salvageValue, yearsValue), error: null };
        case 'double-declining':
          return { result: doubleDeclining(costValue, salvageValue, yearsValue), error: null };
        case 'sum-of-years-digits':
          return { result: sumOfYearsDigits(costValue, salvageValue, yearsValue), error: null };
        case 'units-of-activity': {
          if (unitsPerPeriod.length === 0 || unitsPerPeriod.some((value) => !Number.isFinite(value))) {
            return { result: null, error: '请填写合法的各期工作量，以逗号或换行分隔' };
          }
          return {
            result: unitsOfActivity(costValue, salvageValue, unitsPerPeriod, totalUnitsValue),
            error: null,
          };
        }
        default:
          return { result: null, error: '未知折旧方法' };
      }
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [method, costValue, salvageValue, yearsValue, totalUnitsValue, unitsPerPeriod]);

  const rows: TableRow[] = React.useMemo(
    () => (result ? result.rows.map((row) => ({ ...row, key: row.period })) : []),
    [result],
  );

  const columns: ColumnsType<TableRow> = [
    {
      title: method === 'units-of-activity' ? '期次' : '年度',
      dataIndex: 'period',
      key: 'period',
      width: 90,
      render: (value: number) => `第 ${value} ${method === 'units-of-activity' ? '期' : '年'}`,
    },
    {
      title: '当期折旧额（元）',
      dataIndex: 'depreciation',
      key: 'depreciation',
      render: (value: number) => <span className={styles.mono}>{formatCurrency(value)}</span>,
    },
    {
      title: '累计折旧（元）',
      dataIndex: 'accumulated',
      key: 'accumulated',
      render: (value: number) => <span className={styles.mono}>{formatCurrency(value)}</span>,
    },
    {
      title: '期末账面净值（元）',
      dataIndex: 'bookValue',
      key: 'bookValue',
      render: (value: number) => (
        <strong className={styles.mono}>{formatCurrency(value)}</strong>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">固定资产折旧</Tag>
        <span className={styles.hint}>
          四种折旧方法逐期明细，金额保留两位小数，期末净值恒等于预计净残值，全程本地运算
        </span>
      </div>

      <Card className={styles.card} title="折旧方法" size="small">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={METHOD_OPTIONS}
          value={method}
          onChange={(event) => setMethod(event.target.value as DepreciationMethod)}
        />
      </Card>

      <Card className={styles.card} title="资产参数" size="small">
        <div className={styles.options}>
          <span className={styles.option}>
            <span className={styles.label}>资产原值（元）</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0}
              step={1000}
              value={cost}
              onChange={setCost}
            />
          </span>
          <span className={styles.option}>
            <span className={styles.label}>预计净残值（元）</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0}
              step={1000}
              value={salvage}
              onChange={setSalvage}
            />
          </span>
          {method === 'units-of-activity' ? (
            <>
              <span className={styles.option}>
                <span className={styles.label}>预计总工作量</span>
                <InputNumber<number>
                  className={styles.numberInput}
                  size="small"
                  min={1}
                  step={1000}
                  value={totalUnits}
                  onChange={setTotalUnits}
                />
              </span>
              <span className={styles.optionWide}>
                <span className={styles.label}>各期工作量（逗号或换行分隔）</span>
                <input
                  className={styles.textInput}
                  value={unitsText}
                  onChange={(event) => setUnitsText(event.target.value)}
                  placeholder="例如：30000,20000,40000"
                />
              </span>
            </>
          ) : (
            <span className={styles.option}>
              <span className={styles.label}>折旧年限（年）</span>
              <InputNumber<number>
                className={styles.numberInput}
                size="small"
                min={1}
                max={100}
                step={1}
                value={years}
                onChange={setYears}
              />
            </span>
          )}
        </div>
        {error !== null ? (
          <Alert className={styles.notice} type="error" showIcon message={error} />
        ) : null}
      </Card>

      {result ? (
        <Card className={styles.card} title="折旧明细" size="small">
          <div className={styles.stats}>
            <Statistic title="可折旧总额（元）" value={result.depreciableBase} formatter={(value) => formatCurrency(Number(value))} />
            <Statistic
              title={method === 'units-of-activity' ? '期数' : '折旧年数'}
              value={result.rows.length}
            />
            <Statistic
              title="期末账面净值（元）"
              value={result.rows[result.rows.length - 1]?.bookValue ?? 0}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </div>
          <Table<TableRow>
            className={styles.table}
            columns={columns}
            dataSource={rows}
            pagination={result.rows.length > 10 ? { pageSize: 10, showSizeChanger: false, size: 'small' } : false}
            size="small"
          />
        </Card>
      ) : null}
    </div>
  );
};

export default FixedAssetDepreciationCalculator;
