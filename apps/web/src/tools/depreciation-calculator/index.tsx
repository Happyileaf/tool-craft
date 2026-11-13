'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  message,
  Select,
  Statistic,
  Table,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_ASSET,
  DEFAULT_TOTAL_UNITS,
  DEFAULT_YEARLY_UNITS_TEXT,
  METHOD_OPTIONS,
} from './constants';
import {
  doubleDeclining,
  straightLine,
  sumOfYearsDigits,
  toCsv,
  unitsOfProduction,
  validateAssetInput,
  type AssetInput,
  type DepreciationMethod,
  type YearRow,
} from './utils/depreciation';
import styles from './index.module.css';

/** 千分位金额格式化参数，固定保留 2 位小数 */
const MONEY_FORMAT = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/**
 * 格式化为带千分位、保留 2 位小数的金额文本
 * @param value - 金额数值
 * @returns 形如 100,000.00 的文本
 */
function formatMoney(value: number): string {
  return value.toLocaleString('zh-CN', MONEY_FORMAT);
}

/**
 * 将年折旧率小数格式化为百分比文本，无折旧率的行（工作量法）显示短横线
 * @param rate - 年折旧率小数
 * @returns 形如 25.00% 的文本
 */
function formatRate(rate: number | undefined): string {
  return rate === undefined ? '—' : `${(rate * 100).toFixed(2)}%`;
}

/**
 * 解析逗号分隔的年度工作量文本
 * @param text - 原始输入文本
 * @returns 解析结果；成功时返回数值数组，失败时返回错误信息
 */
function parseYearlyUnits(text: string): { ok: true; units: number[] } | { ok: false; error: string } {
  const tokens = text
    .split(/[,，;；\s]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return { ok: false, error: '年度工作量不能为空，请输入至少一个年度的工作量' };
  }
  const units: number[] = [];
  for (const token of tokens) {
    const value = Number(token);
    if (!Number.isFinite(value)) {
      return { ok: false, error: `年度工作量「${token}」不是有效数字` };
    }
    if (value < 0) {
      return { ok: false, error: `年度工作量「${token}」不能为负数` };
    }
    units.push(value);
  }
  return { ok: true, units };
}

/**
 * 固定资产折旧计算器（中国企业会计准则口径）：
 * 支持年限平均法、工作量法、双倍余额递减法、年数总和法四种折旧方法，
 * 输出逐年折旧明细、统计卡片与可复制的 CSV，全部计算在浏览器本地完成。
 *
 * @returns 固定资产折旧计算器界面
 */
const DepreciationCalculator: React.FC<ToolComponentProps> = () => {
  const [cost, setCost] = React.useState<number | null>(DEFAULT_ASSET.cost);
  const [salvage, setSalvage] = React.useState<number | null>(DEFAULT_ASSET.salvage);
  const [usefulLife, setUsefulLife] = React.useState<number | null>(DEFAULT_ASSET.usefulLife);
  const [method, setMethod] = React.useState<DepreciationMethod>('straight-line');
  const [totalUnits, setTotalUnits] = React.useState<number | null>(DEFAULT_TOTAL_UNITS);
  const [yearlyUnitsText, setYearlyUnitsText] = React.useState<string>(DEFAULT_YEARLY_UNITS_TEXT);

  const isProduction = method === 'units-of-production';

  const parsedUnits = React.useMemo(
    () => (isProduction ? parseYearlyUnits(yearlyUnitsText) : null),
    [isProduction, yearlyUnitsText],
  );

  const assetInput: AssetInput | null =
    cost === null || salvage === null || usefulLife === null
      ? null
      : { cost, salvage, usefulLife };

  const validation = React.useMemo(() => {
    if (assetInput === null) {
      return {
        valid: false,
        errors: ['原值、预计净残值与使用年限均不能为空'],
      };
    }
    if (isProduction) {
      if (parsedUnits === null || !parsedUnits.ok || totalUnits === null) {
        return { valid: false, errors: parsedUnits && !parsedUnits.ok ? [parsedUnits.error] : ['请填写总工作量与年度工作量'] };
      }
      return validateAssetInput(assetInput, {
        totalUnits,
        yearlyUnits: parsedUnits.units,
      });
    }
    return validateAssetInput(assetInput);
  }, [assetInput, isProduction, parsedUnits, totalUnits]);

  const rows = React.useMemo<YearRow[]>(() => {
    if (!validation.valid || assetInput === null) {
      return [];
    }
    switch (method) {
      case 'straight-line':
        return straightLine(assetInput);
      case 'double-declining':
        return doubleDeclining(assetInput);
      case 'sum-of-years-digits':
        return sumOfYearsDigits(assetInput);
      case 'units-of-production':
        if (parsedUnits === null || !parsedUnits.ok || totalUnits === null) {
          return [];
        }
        return unitsOfProduction(assetInput, totalUnits, parsedUnits.units);
      default:
        return [];
    }
  }, [validation.valid, assetInput, method, parsedUnits, totalUnits]);

  const csvText = React.useMemo(() => (rows.length > 0 ? toCsv(rows) : ''), [rows]);

  const handleCopy = async (): Promise<void> => {
    if (csvText === '') {
      message.warning('暂无可复制的 CSV 内容');
      return;
    }
    await copyToClipboard(csvText);
    message.success('CSV 内容已复制到剪贴板');
  };

  const depreciableBase = assetInput === null ? 0 : assetInput.cost - assetInput.salvage;
  const firstYearDepreciation = rows[0]?.depreciation ?? 0;
  const activeMethod = METHOD_OPTIONS.find((option) => option.value === method);

  const columns: ColumnsType<YearRow> = [
    { title: '年份', dataIndex: 'year', key: 'year', width: 90 },
    {
      title: '年折旧额（元）',
      dataIndex: 'depreciation',
      key: 'depreciation',
      render: (value: number) => <span className={styles.mono}>{formatMoney(value)}</span>,
    },
    {
      title: '累计折旧（元）',
      dataIndex: 'accumulatedDepreciation',
      key: 'accumulatedDepreciation',
      render: (value: number) => <span className={styles.mono}>{formatMoney(value)}</span>,
    },
    {
      title: '年末账面净值（元）',
      dataIndex: 'bookValue',
      key: 'bookValue',
      render: (value: number) => <span className={styles.mono}>{formatMoney(value)}</span>,
    },
    {
      title: '年折旧率',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      render: (value: number | undefined) => <span className={styles.mono}>{formatRate(value)}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="固定资产折旧计算器">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>固定资产原值（元）</label>
            <InputNumber
              value={cost}
              min={0}
              step={1000}
              style={{ width: '100%' }}
              onChange={(value) => setCost(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>预计净残值（元）</label>
            <InputNumber
              value={salvage}
              min={0}
              step={500}
              style={{ width: '100%' }}
              onChange={(value) => setSalvage(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>预计使用年限（年，1-50 的整数）</label>
            <InputNumber
              value={usefulLife}
              min={1}
              max={50}
              step={1}
              precision={0}
              style={{ width: '100%' }}
              onChange={(value) => setUsefulLife(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>折旧方法</label>
            <Select<DepreciationMethod>
              value={method}
              style={{ width: '100%' }}
              onChange={(value) => setMethod(value)}
              options={METHOD_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>
        </div>

        {isProduction ? (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>预计总工作量</label>
              <InputNumber
                value={totalUnits}
                min={0}
                step={1000}
                style={{ width: '100%' }}
                onChange={(value) => setTotalUnits(value === null ? null : Number(value))}
              />
            </div>
            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
              <label>各年度实际工作量（逗号分隔，数量即折旧年数）</label>
              <Input
                value={yearlyUnitsText}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setYearlyUnitsText(event.target.value)
                }
                spellCheck={false}
                placeholder="例如：20000,30000,25000,20000"
              />
            </div>
          </div>
        ) : null}
        <p className={styles.hint}>{activeMethod?.description ?? ''}</p>

        {!validation.valid ? (
          <Alert
            type="error"
            showIcon
            message="参数不合法"
            description={
              <ul className={styles.alertList}>
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            }
          />
        ) : (
          <>
            <div className={styles.statsGrid}>
              <Card size="small">
                <Statistic title="原值（元）" value={formatMoney(assetInput?.cost ?? 0)} />
              </Card>
              <Card size="small">
                <Statistic title="预计净残值（元）" value={formatMoney(assetInput?.salvage ?? 0)} />
              </Card>
              <Card size="small">
                <Statistic title="应计折旧额（元）" value={formatMoney(depreciableBase)} />
              </Card>
              <Card size="small">
                <Statistic
                  title={isProduction ? '首年折旧额（元）' : '首年/年均折旧额（元）'}
                  value={formatMoney(firstYearDepreciation)}
                />
              </Card>
            </div>

            <Table<YearRow>
              rowKey="year"
              columns={columns}
              dataSource={rows}
              pagination={false}
              size="small"
              scroll={{ x: 720 }}
            />
          </>
        )}
      </Card>

      <Card
        title="CSV 输出"
        extra={
          <Button type="primary" size="small" icon={<CopyOutlined />} onClick={handleCopy}>
            复制
          </Button>
        }
      >
        <Input.TextArea
          value={csvText}
          readOnly
          spellCheck={false}
          className={styles.mono}
          autoSize={{ minRows: 4, maxRows: 12 }}
          placeholder="参数合法后在此生成 CSV 明细"
        />
        <p className={styles.hint} style={{ marginBottom: 0 }}>
          CSV 使用 CRLF（\r\n）换行，金额保留 2 位小数，年折旧率以百分比表示，可直接粘贴到 Excel 或 WPS。
        </p>
      </Card>

      <Alert
        type="info"
        showIcon
        message="折旧方法说明"
        description={
          <div className={styles.hint}>
            <p>
              年限平均法每年折旧额相同；年数总和法按剩余使用年数占年数总和的比例逐年递减计提；双倍余额递减法前期不考虑净残值，按年初账面净值乘以
              2/年限 计提，并在最后两年改按直线法摊销，确保账面净值不低于预计净残值。
            </p>
            <p>
              工作量法按各年度实际工作量计提，年度工作量数组的长度即折旧年数；所有金额均四舍五入保留
              2 位小数后逐年累加，最后一年吸收历年舍入差，使年末账面净值恰好等于预计净残值。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default DepreciationCalculator;
