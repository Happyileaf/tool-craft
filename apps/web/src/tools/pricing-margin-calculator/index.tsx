'use client';

import React from 'react';
import { Alert, Button, Card, Input, InputNumber, Table, Tabs, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  batchPriceFromMargin,
  breakEvenPrice,
  marginToMarkup,
  markupToMargin,
  solvePricing,
} from './utils/pricing';
import { DEFAULT_BATCH_INPUT, DEFAULT_BREAKEVEN_COST, RATE_TABLE_PERCENTS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const numberFormatter = (value: number) =>
  value.toLocaleString('zh-CN', { maximumFractionDigits: 4 });

const PricingMarginCalculator: React.FC<ToolComponentProps> = () => {
  const [cost, setCost] = React.useState<number | null>(80);
  const [price, setPrice] = React.useState<number | null>(100);
  const [marginPercent, setMarginPercent] = React.useState<number | null>(null);
  const [markupPercent, setMarkupPercent] = React.useState<number | null>(null);

  const [batchText, setBatchText] = React.useState(DEFAULT_BATCH_INPUT);
  const [breakEvenCost, setBreakEvenCost] = React.useState<number | null>(DEFAULT_BREAKEVEN_COST);
  const [discountPercent, setDiscountPercent] = React.useState<number | null>(20);

  const solved = React.useMemo(
    () => solvePricing({ cost, price, marginPercent, markupPercent }),
    [cost, price, marginPercent, markupPercent],
  );

  const batch = React.useMemo(() => batchPriceFromMargin(batchText), [batchText]);

  const breakEven = React.useMemo(() => {
    if (
      breakEvenCost === null ||
      discountPercent === null ||
      !Number.isFinite(breakEvenCost) ||
      !Number.isFinite(discountPercent)
    ) {
      return null;
    }
    try {
      return breakEvenPrice(breakEvenCost, discountPercent);
    } catch {
      return null;
    }
  }, [breakEvenCost, discountPercent]);

  const handleCopyCsv = () => {
    if (batch.csv.trim() === 'cost,margin_percent,price') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(batch.csv);
    message.success('已复制 CSV 结果');
  };

  const rateTableData = RATE_TABLE_PERCENTS.map((percent) => {
    const margin = percent / 100;
    const markup = marginToMarkup(margin);
    return {
      key: percent,
      marginPercent: percent,
      markupPercent: Number((markup * 100).toFixed(4)),
      reverse: Number((markupToMargin(markup) * 100).toFixed(4)),
    };
  });

  return (
    <div className={styles.container}>
      <Tabs
        items={[
          {
            key: 'solve',
            label: '双向定价求解',
            children: (
              <div className={styles.panels}>
                <Card className={styles.card} title="已知量（至少填两项）">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label>
                      <div className={styles.metaLabel} style={{ marginBottom: 4 }}>
                        成本价
                      </div>
                      <InputNumber
                        value={cost}
                        onChange={setCost}
                        min={0}
                        precision={2}
                        style={{ width: '100%' }}
                        addonAfter="元"
                        placeholder="输入成本价"
                      />
                    </label>
                    <label>
                      <div className={styles.metaLabel} style={{ marginBottom: 4 }}>
                        售价
                      </div>
                      <InputNumber
                        value={price}
                        onChange={setPrice}
                        min={0}
                        precision={2}
                        style={{ width: '100%' }}
                        addonAfter="元"
                        placeholder="输入售价"
                      />
                    </label>
                    <label>
                      <div className={styles.metaLabel} style={{ marginBottom: 4 }}>
                        毛利率（分母为售价）
                      </div>
                      <InputNumber
                        value={marginPercent}
                        onChange={setMarginPercent}
                        min={0}
                        max={99.9999}
                        precision={4}
                        style={{ width: '100%' }}
                        addonAfter="%"
                        placeholder="如 20 表示 20%"
                      />
                    </label>
                    <label>
                      <div className={styles.metaLabel} style={{ marginBottom: 4 }}>
                        加价率（分母为成本）
                      </div>
                      <InputNumber
                        value={markupPercent}
                        onChange={setMarkupPercent}
                        min={0}
                        precision={4}
                        style={{ width: '100%' }}
                        addonAfter="%"
                        placeholder="如 25 表示 25%"
                      />
                    </label>
                  </div>
                </Card>
                <Card className={styles.card} title="求解结果">
                  {!solved.ok ? (
                    <Alert type="info" showIcon message={solved.error} />
                  ) : (
                    <>
                      <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                          <span className={styles.resultLabel}>售价</span>
                          <span className={styles.resultValue}>{numberFormatter(solved.price)}</span>
                        </div>
                        <div className={styles.resultItem}>
                          <span className={styles.resultLabel}>成本价</span>
                          <span className={styles.resultValue}>{numberFormatter(solved.cost)}</span>
                        </div>
                        <div className={styles.resultItem}>
                          <span className={styles.resultLabel}>毛利率</span>
                          <span className={styles.resultValue}>
                            {(solved.margin * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className={styles.resultItem}>
                          <span className={styles.resultLabel}>加价率</span>
                          <span className={styles.resultValue}>
                            {(solved.markup * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className={styles.resultItem}>
                          <span className={styles.resultLabel}>毛利额</span>
                          <span className={styles.resultValue}>
                            {numberFormatter(solved.profit)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          <span className={styles.metaLabel}>口径</span>
                          <span className={styles.metaValue}>
                            毛利率=(售价−成本)/售价，加价率=(售价−成本)/成本
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            ),
          },
          {
            key: 'batch',
            label: '批量按毛利率定价',
            children: (
              <div className={styles.panels}>
                <Card
                  className={styles.card}
                  title="输入（每行：成本,毛利率%）"
                  extra={
                    <Button size="small" onClick={() => setBatchText(DEFAULT_BATCH_INPUT)}>
                      载入样例
                    </Button>
                  }
                >
                  <Input.TextArea
                    value={batchText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setBatchText(e.target.value)
                    }
                    spellCheck={false}
                    className={styles.editor}
                    autoSize={{ minRows: 10, maxRows: 20 }}
                  />
                </Card>
                <Card
                  className={styles.card}
                  title="定价结果（CSV）"
                  extra={
                    <Button size="small" icon={<CopyOutlined />} onClick={handleCopyCsv}>
                      复制 CSV
                    </Button>
                  }
                >
                  <Input.TextArea
                    value={batch.csv}
                    readOnly
                    spellCheck={false}
                    className={styles.editor}
                    autoSize={{ minRows: 10, maxRows: 20 }}
                  />
                  {batch.warnings.length > 0 ? (
                    <div className={styles.warnings}>
                      {batch.warnings.map((warning, index) => (
                        <Alert
                          key={`${index}-${warning}`}
                          type="warning"
                          showIcon
                          className={styles.warningItem}
                          message={warning}
                        />
                      ))}
                    </div>
                  ) : null}
                </Card>
              </div>
            ),
          },
          {
            key: 'breakeven',
            label: '折扣保本价',
            children: (
              <Card className={styles.card} title="保本售价反推">
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <label>
                    <div className={styles.metaLabel} style={{ marginBottom: 4 }}>
                      成本价
                    </div>
                    <InputNumber
                      value={breakEvenCost}
                      onChange={setBreakEvenCost}
                      min={0}
                      precision={2}
                      addonAfter="元"
                      style={{ width: 160 }}
                    />
                  </label>
                  <label>
                    <div className={styles.metaLabel} style={{ marginBottom: 4 }}>
                      折扣让利（20 = 打八折）
                    </div>
                    <InputNumber
                      value={discountPercent}
                      onChange={setDiscountPercent}
                      min={0}
                      max={99.9999}
                      precision={4}
                      addonAfter="%"
                      style={{ width: 200 }}
                    />
                  </label>
                </div>
                {breakEven === null ? (
                  <Alert
                    style={{ marginTop: 16 }}
                    type="info"
                    showIcon
                    message="请输入非负成本与 [0%, 100%) 的折扣率"
                  />
                ) : (
                  <div className={styles.meta} style={{ marginTop: 16 }}>
                    <span className={styles.metaItem}>
                      <span className={styles.metaLabel}>保本售价</span>
                      <span className={styles.metaValue} style={{ fontSize: 18, fontWeight: 600 }}>
                        {numberFormatter(breakEven)} 元
                      </span>
                    </span>
                    <span className={styles.metaItem}>
                      <span className={styles.metaLabel}>验算</span>
                      <span className={styles.metaValue}>
                        {numberFormatter(breakEven)} ×{' '}
                        {Number((100 - (discountPercent ?? 0)).toFixed(4))}% ={' '}
                        {numberFormatter(
                          (breakEven * (100 - (discountPercent ?? 0))) / 100,
                        )}{' '}
                        元
                      </span>
                    </span>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'rates',
            label: '两率互转对照',
            children: (
              <Card className={styles.card} title="毛利率 ↔ 加价率对照表">
                <Table
                  size="small"
                  pagination={false}
                  dataSource={rateTableData}
                  columns={[
                    { title: '毛利率', dataIndex: 'marginPercent', render: (v) => `${v}%` },
                    {
                      title: '对应加价率',
                      dataIndex: 'markupPercent',
                      render: (v) => `${v}%`,
                    },
                    {
                      title: '逆运算回毛利率',
                      dataIndex: 'reverse',
                      render: (v) => `${v}%`,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default PricingMarginCalculator;
