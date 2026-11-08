'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  snapshotFromCostPrice,
  priceFromMargin,
  priceFromMarkup,
  costFromPriceAndMargin,
  marginToMarkup,
  markupToMargin,
  batchPriceByMargin,
  batchRowsToCsv,
  breakEvenDiscounts,
  type PricingSnapshot,
} from './utils/pricing';
import {
  REFERENCE_MARGINS,
  DEFAULT_DISCOUNT_RATES,
  DEFAULT_BATCH_INPUT,
  COST_PRESETS,
} from './constants';
import styles from './index.module.css';

type SolveMode = 'snapshot' | 'priceByMargin' | 'priceByMarkup' | 'costByMargin';

const MODE_LABELS: Record<SolveMode, string> = {
  snapshot: '已知成本 + 售价，核算毛利率 / 加价率',
  priceByMargin: '已知成本 + 目标毛利率，反推售价',
  priceByMarkup: '已知成本 + 加价率，反推售价',
  costByMargin: '已知售价 + 目标毛利率，反推最高成本',
};

const percentFormatter = (value: number | undefined) =>
  value === undefined || Number.isNaN(value) ? '—' : `${(value * 100).toFixed(2)}%`;

const moneyFormatter = (value: number | undefined) =>
  value === undefined || Number.isNaN(value) ? '—' : `¥ ${value.toFixed(2)}`;

/**
 * 毛利率 / 加价率 / 售价双向定价计算器：
 * 严格区分毛利率（分母为售价）与加价率（分母为成本），
 * 提供单笔双向求解、批量定价 CSV、折扣保本分析与口径互转对照，全部本地运算。
 */
const PricingMarginCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<SolveMode>('snapshot');
  const [cost, setCost] = React.useState(80);
  const [price, setPrice] = React.useState(100);
  const [marginPercent, setMarginPercent] = React.useState(20);
  const [markupPercent, setMarkupPercent] = React.useState(25);
  const [batchInput, setBatchInput] = React.useState(DEFAULT_BATCH_INPUT);
  const [listPrice, setListPrice] = React.useState(100);
  const [discountCost, setDiscountCost] = React.useState(60);
  const [discountText, setDiscountText] = React.useState(DEFAULT_DISCOUNT_RATES.join(','));

  const snapshot = React.useMemo((): PricingSnapshot | { error: string } => {
    try {
      const margin = marginPercent / 100;
      const markup = markupPercent / 100;
      switch (mode) {
        case 'snapshot':
          return snapshotFromCostPrice(cost, price);
        case 'priceByMargin':
          return priceFromMargin(cost, margin);
        case 'priceByMarkup':
          return priceFromMarkup(cost, markup);
        case 'costByMargin':
          return costFromPriceAndMargin(price, margin);
        default:
          return snapshotFromCostPrice(cost, price);
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, cost, price, marginPercent, markupPercent]);

  const batchRows = React.useMemo(() => {
    const parsed = batchInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [costToken, marginToken] = line.split(/[,，\s]+/);
        return { cost: Number(costToken), margin: Number(marginToken) / 100 };
      });
    if (parsed.length === 0) {
      return { error: '请输入至少一行「成本,毛利率%」数据' };
    }
    if (parsed.some((row) => !Number.isFinite(row.cost) || !Number.isFinite(row.margin))) {
      return { error: '存在无法解析的行，请检查每行格式：成本,毛利率百分比（如 80,20）' };
    }
    try {
      return { rows: batchPriceByMargin(parsed) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [batchInput]);

  const discountResults = React.useMemo(() => {
    const rates = discountText
      .split(/[,，\s]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => Number(token) / 100);
    if (rates.some((rate) => !Number.isFinite(rate))) {
      return { error: '折扣率无法解析，请输入逗号分隔的百分比（如 10,20,30）' };
    }
    try {
      return { rows: breakEvenDiscounts(listPrice, discountCost, rates) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [listPrice, discountCost, discountText]);

  const copyCsv = async () => {
    if (!('rows' in batchRows)) return;
    try {
      await navigator.clipboard.writeText(batchRowsToCsv(batchRows.rows));
      message.success('CSV 已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择表格结果复制');
    }
  };

  const batchColumns = [
    { title: '序号', dataIndex: 'index', key: 'index', width: 72 },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (value: number) => <span className={styles.mono}>{moneyFormatter(value)}</span>,
    },
    {
      title: '目标毛利率',
      dataIndex: 'margin',
      key: 'margin',
      align: 'right' as const,
      render: (value: number) => <span className={styles.mono}>{percentFormatter(value)}</span>,
    },
    {
      title: '售价',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      render: (value: number) => (
        <span className={`${styles.mono} ${styles.highlight}`}>{moneyFormatter(value)}</span>
      ),
    },
    {
      title: '毛利额',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      align: 'right' as const,
      render: (value: number) => <span className={styles.mono}>{moneyFormatter(value)}</span>,
    },
  ];

  const discountColumns = [
    {
      title: '折扣（让利幅度）',
      dataIndex: 'discount',
      key: 'discount',
      render: (value: number) => <Tag color="blue">{percentFormatter(value)} off</Tag>,
    },
    {
      title: '折后价',
      dataIndex: 'discountedPrice',
      key: 'discountedPrice',
      align: 'right' as const,
      render: (value: number) => <span className={styles.mono}>{moneyFormatter(value)}</span>,
    },
    {
      title: '折后利润',
      dataIndex: 'profit',
      key: 'profit',
      align: 'right' as const,
      render: (value: number) => (
        <span className={`${styles.mono} ${value < 0 ? styles.danger : ''}`}>
          {moneyFormatter(value)}
        </span>
      ),
    },
    {
      title: '是否保本',
      dataIndex: 'breaksEven',
      key: 'breaksEven',
      render: (value: boolean) =>
        value ? <Tag color="green">保本</Tag> : <Tag color="red">亏本</Tag>,
    },
  ];

  const referenceRows = REFERENCE_MARGINS.map((margin) => ({
    key: margin,
    margin,
    markup: marginToMarkup(margin),
  }));

  const referenceColumns = [
    {
      title: '毛利率 margin（分母为售价）',
      dataIndex: 'margin',
      key: 'margin',
      render: (value: number) => <span className={styles.mono}>{percentFormatter(value)}</span>,
    },
    {
      title: '等价加价率 markup（分母为成本）',
      dataIndex: 'markup',
      key: 'markup',
      render: (value: number) => <span className={styles.mono}>{percentFormatter(value)}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="毛利率 / 加价率 / 售价双向定价计算器">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="口径区分：毛利率 =（售价 − 成本）÷ 售价，加价率 markup =（售价 − 成本）÷ 成本。例如成本 80、售价 100 时，毛利率为 20%，加价率为 25%，二者不可混用。所有计算均在浏览器本地完成。"
        />

        <Tabs
          items={[
            {
              key: 'single',
              label: '单笔双向求解',
              children: (
                <>
                  <Radio.Group
                    value={mode}
                    onChange={(event) => setMode(event.target.value as SolveMode)}
                    style={{ marginBottom: 16 }}
                    optionType="button"
                    buttonStyle="solid"
                    options={(Object.keys(MODE_LABELS) as SolveMode[]).map((key) => ({
                      label: MODE_LABELS[key],
                      value: key,
                    }))}
                  />

                  <Form layout="vertical">
                    <div className={styles.fieldGrid}>
                      {(mode === 'snapshot' ||
                        mode === 'priceByMargin' ||
                        mode === 'priceByMarkup') && (
                        <Form.Item label="成本价（元）">
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={1}
                            value={cost}
                            onChange={(v) => setCost(Number(v ?? 0))}
                            addonAfter="元"
                          />
                          <Space wrap style={{ marginTop: 8 }}>
                            {COST_PRESETS.map((preset) => (
                              <Button
                                key={preset}
                                size="small"
                                onClick={() => setCost(preset)}
                              >
                                {preset}
                              </Button>
                            ))}
                          </Space>
                        </Form.Item>
                      )}

                      {(mode === 'snapshot' || mode === 'costByMargin') && (
                        <Form.Item label="售价（元）">
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={1}
                            value={price}
                            onChange={(v) => setPrice(Number(v ?? 0))}
                            addonAfter="元"
                          />
                        </Form.Item>
                      )}

                      {(mode === 'priceByMargin' || mode === 'costByMargin') && (
                        <Form.Item label="目标毛利率（%）">
                          <InputNumber
                            style={{ width: '100%' }}
                            step={1}
                            value={marginPercent}
                            onChange={(v) => setMarginPercent(Number(v ?? 0))}
                            addonAfter="%"
                          />
                          <div className={styles.hint} style={{ marginTop: 4 }}>
                            毛利率必须小于 100%，支持负值（亏本定价）
                          </div>
                        </Form.Item>
                      )}

                      {mode === 'priceByMarkup' && (
                        <Form.Item label="加价率 markup（%）">
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={1}
                            value={markupPercent}
                            onChange={(v) => setMarkupPercent(Number(v ?? 0))}
                            addonAfter="%"
                          />
                          <div className={styles.hint} style={{ marginTop: 4 }}>
                            等价毛利率：{percentFormatter(
                              Number.isFinite(markupPercent)
                                ? markupToMargin(markupPercent / 100)
                                : undefined,
                            )}
                          </div>
                        </Form.Item>
                      )}
                    </div>
                  </Form>

                  {'error' in snapshot ? (
                    <Alert type="error" showIcon message={snapshot.error} />
                  ) : (
                    <div className={styles.statGrid}>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>成本价</div>
                        <div className={`${styles.statValue} mono`}>
                          {moneyFormatter(snapshot.cost)}
                        </div>
                      </div>
                      <div className={`${styles.statCard} ${styles.highlight}`}>
                        <div className={styles.statLabel}>售价</div>
                        <div className={`${styles.statValue} mono`}>
                          {moneyFormatter(snapshot.price)}
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>毛利额</div>
                        <div
                          className={`${styles.statValue} mono ${
                            snapshot.grossProfit < 0 ? styles.danger : ''
                          }`}
                        >
                          {moneyFormatter(snapshot.grossProfit)}
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>毛利率 / 加价率</div>
                        <div className={`${styles.statValue} mono`}>
                          {percentFormatter(snapshot.margin)}
                        </div>
                        <div className={styles.hint}>
                          markup：
                          {Number.isNaN(snapshot.markup)
                            ? '成本为 0，无定义'
                            : percentFormatter(snapshot.markup)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ),
            },
            {
              key: 'batch',
              label: '批量定价（CSV）',
              children: (
                <>
                  <Form layout="vertical">
                    <Form.Item
                      label="批量输入（每行一条：成本,毛利率百分比）"
                      extra="支持逗号、中文逗号或空格分隔，例如 80,20 表示成本 80 元、目标毛利率 20%"
                    >
                      <Input.TextArea
                        rows={6}
                        value={batchInput}
                        onChange={(event) => setBatchInput(event.target.value)}
                        className={styles.mono}
                      />
                    </Form.Item>
                  </Form>
                  <Space style={{ marginBottom: 12 }}>
                    <Button onClick={() => setBatchInput(DEFAULT_BATCH_INPUT)}>重置示例</Button>
                    <Button type="primary" onClick={copyCsv} disabled={!('rows' in batchRows)}>
                      复制 CSV
                    </Button>
                  </Space>
                  {'error' in batchRows ? (
                    <Alert type="error" showIcon message={batchRows.error} />
                  ) : (
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="index"
                      columns={batchColumns}
                      dataSource={batchRows.rows}
                    />
                  )}
                </>
              ),
            },
            {
              key: 'discount',
              label: '折扣保本分析',
              children: (
                <>
                  <Form layout="vertical">
                    <div className={styles.fieldGrid}>
                      <Form.Item label="标价（元）">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={1}
                          value={listPrice}
                          onChange={(v) => setListPrice(Number(v ?? 0))}
                          addonAfter="元"
                        />
                      </Form.Item>
                      <Form.Item label="成本价（元）">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={1}
                          value={discountCost}
                          onChange={(v) => setDiscountCost(Number(v ?? 0))}
                          addonAfter="元"
                        />
                      </Form.Item>
                    </div>
                    <Form.Item
                      label="待评估折扣率（让利百分比，逗号分隔）"
                      extra="20 表示让利 20%（即打 8 折）；保本临界折扣率 = 1 − 成本 ÷ 标价"
                    >
                      <Input
                        value={discountText}
                        onChange={(event) => setDiscountText(event.target.value)}
                        className={styles.mono}
                      />
                    </Form.Item>
                  </Form>
                  {'error' in discountResults ? (
                    <Alert type="error" showIcon message={discountResults.error} />
                  ) : (
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="discount"
                      columns={discountColumns}
                      dataSource={discountResults.rows}
                    />
                  )}
                </>
              ),
            },
            {
              key: 'reference',
              label: '毛利率 / 加价率互转对照',
              children: (
                <>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="换算公式：加价率 = 毛利率 ÷（1 − 毛利率）；毛利率 = 加价率 ÷（1 + 加价率）。同一价位下，加价率在数值上始终大于毛利率。"
                  />
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="key"
                    columns={referenceColumns}
                    dataSource={referenceRows}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default PricingMarginCalculator;
