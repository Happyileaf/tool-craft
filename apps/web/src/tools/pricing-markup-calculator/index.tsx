"use client";

import React from "react";
import { Alert, Button, Card, Input, Radio, Table, Tag, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import type { ToolComponentProps } from "../loaders";
import { copyToClipboard } from "@/lib/utils";
import {
  PRICING_MODE_OPTIONS,
  RATE_BASIS_OPTIONS,
  DEFAULT_BATCH_INPUT,
  DEFAULT_BATCH_MARGIN,
  DEFAULT_DISCOUNT_INPUT,
  PricingMode,
  RateBasis,
} from "./constants";
import {
  parseNumeric,
  parsePercent,
  fromCostAndPrice,
  priceFromMargin,
  priceFromMarkup,
  costFromMargin,
  costFromMarkup,
  markupFromMargin,
  marginFromMarkup,
  breakEvenListPrice,
  batchPricing,
  batchToCsv,
  roundTrim,
  formatPercent,
  type PricingResult,
} from "./utils/pricing";
import styles from "./index.module.css";

function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

const PricingMarkupCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<PricingMode>(PricingMode.INSPECT);
  const [basis, setBasis] = React.useState<RateBasis>(RateBasis.MARGIN);
  const [costInput, setCostInput] = React.useState("80");
  const [priceInput, setPriceInput] = React.useState("100");
  const [rateInput, setRateInput] = React.useState("20%");
  const [batchInput, setBatchInput] = React.useState(DEFAULT_BATCH_INPUT);
  const [batchMarginInput, setBatchMarginInput] = React.useState("20%");
  const [discountCostInput, setDiscountCostInput] = React.useState("80");
  const [discountInput, setDiscountInput] = React.useState(DEFAULT_DISCOUNT_INPUT);

  const cost = parseNumeric(costInput);
  const price = parseNumeric(priceInput);
  const rate = parsePercent(rateInput);

  const singleResult = React.useMemo(() => {
    if (mode === PricingMode.INSPECT) {
      if (cost === null || price === null) {
        return { kind: "empty" as const, text: "请填写有效的成本价与售价" };
      }
      const r = fromCostAndPrice(cost, price);
      if (isError(r)) {
        return { kind: "error" as const, text: r.error };
      }
      return { kind: "ok" as const, data: r };
    }

    if (mode === PricingMode.PRICE_FROM_COST) {
      if (cost === null || rate === null) {
        return { kind: "empty" as const, text: "请填写有效的成本价与目标利润率" };
      }
      const r =
        basis === RateBasis.MARGIN ? priceFromMargin(cost, rate) : priceFromMarkup(cost, rate);
      if (isError(r)) {
        return { kind: "error" as const, text: r.error };
      }
      const full = fromCostAndPrice(cost, r.price);
      return { kind: "ok" as const, data: isError(full) ? null : full, solvedPrice: r.price };
    }

    if (price === null || rate === null) {
      return { kind: "empty" as const, text: "请填写有效的售价与目标利润率" };
    }
    const r = basis === RateBasis.MARGIN ? costFromMargin(price, rate) : costFromMarkup(price, rate);
    if (isError(r)) {
      return { kind: "error" as const, text: r.error };
    }
    const full = fromCostAndPrice(r.cost, price);
    return { kind: "ok" as const, data: isError(full) ? null : full, solvedCost: r.cost };
  }, [mode, basis, cost, price, rate]);

  const conversion = React.useMemo(() => {
    if (rate === null) {
      return null;
    }
    if (basis === RateBasis.MARGIN) {
      const markup = markupFromMargin(rate);
      return isError(markup) ? null : { from: "毛利率", fromValue: rate, to: "加价率", toValue: markup };
    }
    const margin = marginFromMarkup(rate);
    return isError(margin) ? null : { from: "加价率", fromValue: rate, to: "毛利率", toValue: margin };
  }, [basis, rate]);

  const batchMargin = parsePercent(batchMarginInput) ?? DEFAULT_BATCH_MARGIN;
  const batchRows = React.useMemo(
    () => batchPricing(batchInput, batchMargin),
    [batchInput, batchMargin],
  );
  const batchErrorCount = batchRows.filter((row) => row.error).length;

  const breakEven = React.useMemo(() => {
    const baseCost = parseNumeric(discountCostInput);
    if (baseCost === null) {
      return { error: "请填写有效的成本价" };
    }
    const discounts = discountInput
      .split(/\r?\n/)
      .map((line) => parseNumeric(line.trim()))
      .filter((value): value is number => value !== null);
    return breakEvenListPrice(baseCost, discounts);
  }, [discountCostInput, discountInput]);

  const handleCopyCsv = () => {
    if (batchRows.length === 0) {
      message.error("暂无可复制的结果");
      return;
    }
    copyToClipboard(batchToCsv(batchRows));
    message.success("已复制 CSV 售价表");
  };

  const renderMetrics = (data: PricingResult | null, fallback?: { price?: number; cost?: number }) => {
    if (!data) {
      return null;
    }
    const metrics: { label: string; value: string }[] = [
      { label: "成本价", value: roundTrim(fallback?.cost ?? data.cost) },
      { label: "售价", value: roundTrim(fallback?.price ?? data.price) },
      { label: "毛利额", value: roundTrim(data.profit) },
      { label: "毛利率（÷售价）", value: formatPercent(data.margin) },
      { label: "加价率（÷成本）", value: formatPercent(data.markup) },
    ];
    return (
      <div className={styles.resultCard}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <span className={styles.metricValue}>{metric.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Card
        title="单条定价换算"
        extra={
          <Radio.Group
            size="small"
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={PRICING_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => setMode(e.target.value as PricingMode)}
          />
        }
      >
        <div className={styles.row}>
          {mode !== PricingMode.COST_FROM_PRICE && (
            <div className={styles.field}>
              <span className={styles.label}>成本价</span>
              <Input value={costInput} onChange={(e) => setCostInput(e.target.value)} style={{ width: 160 }} />
            </div>
          )}
          {mode !== PricingMode.PRICE_FROM_COST && (
            <div className={styles.field}>
              <span className={styles.label}>售价</span>
              <Input value={priceInput} onChange={(e) => setPriceInput(e.target.value)} style={{ width: 160 }} />
            </div>
          )}
          {mode !== PricingMode.INSPECT && (
            <>
              <div className={styles.field}>
                <span className={styles.label}>利润率口径</span>
                <Radio.Group
                  value={basis}
                  options={RATE_BASIS_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                  onChange={(e) => setBasis(e.target.value as RateBasis)}
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>目标利润率（如 20% 或 20）</span>
                <Input value={rateInput} onChange={(e) => setRateInput(e.target.value)} style={{ width: 180 }} />
              </div>
            </>
          )}
        </div>

        {conversion && mode !== PricingMode.INSPECT && (
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message={`口径互转：${conversion.from} ${formatPercent(conversion.fromValue)} ＝ ${conversion.to} ${formatPercent(conversion.toValue)}`}
          />
        )}

        <div style={{ marginTop: 16 }}>
          {singleResult.kind === "error" && <Alert type="error" showIcon message={singleResult.text} />}
          {singleResult.kind === "empty" && <Alert type="warning" showIcon message={singleResult.text} />}
          {singleResult.kind === "ok" &&
            renderMetrics(singleResult.data, {
              price: singleResult.solvedPrice,
              cost: singleResult.solvedCost,
            })}
        </div>
      </Card>

      <Card
        title="批量售价表（每行：成本, 毛利率）"
        extra={
          <>
            <span className={styles.label} style={{ marginRight: 8 }}>
              缺省毛利率
            </span>
            <Input
              size="small"
              value={batchMarginInput}
              onChange={(e) => setBatchMarginInput(e.target.value)}
              style={{ width: 100, marginRight: 8 }}
            />
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopyCsv}>
              复制 CSV
            </Button>
          </>
        }
      >
        <Input.TextArea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          spellCheck={false}
          autoSize={{ minRows: 4, maxRows: 10 }}
        />
        <div className={styles.row} style={{ marginTop: 12 }}>
          <Tag color="blue">共 {batchRows.length} 行</Tag>
          <Tag color={batchErrorCount ? "red" : "green"}>异常 {batchErrorCount} 行</Tag>
        </div>
        <Table
          style={{ marginTop: 12 }}
          size="small"
          rowKey={(_, index) => String(index)}
          pagination={false}
          scroll={{ x: true }}
          dataSource={batchRows}
          columns={[
            { title: "成本", dataIndex: "costInput", key: "costInput" },
            {
              title: "目标毛利率",
              dataIndex: "margin",
              key: "margin",
              render: (value: number) => formatPercent(value),
            },
            {
              title: "售价",
              dataIndex: "price",
              key: "price",
              render: (value: number | null) => (value === null ? "—" : roundTrim(value)),
            },
            {
              title: "错误",
              dataIndex: "error",
              key: "error",
              render: (value?: string) =>
                value ? <span className={styles.errorText}>{value}</span> : <Tag color="green">正常</Tag>,
            },
          ]}
        />
      </Card>

      <Card title="多档折扣保本价反推">
        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>成本价</span>
            <Input
              value={discountCostInput}
              onChange={(e) => setDiscountCostInput(e.target.value)}
              style={{ width: 140 }}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>各档折扣率（每行一个，0.8 = 8 折）</span>
            <Input.TextArea
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              spellCheck={false}
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ width: 240 }}
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          {isError(breakEven) ? (
            <Alert type="error" showIcon message={breakEven.error} />
          ) : (
            <Alert
              type="success"
              showIcon
              message={`最深折扣 ${formatPercent(breakEven.minDiscount)}（${roundTrim(breakEven.minDiscount * 10)} 折）下，挂牌价不低于 ${roundTrim(breakEven.listPrice)} 即可保本`}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default PricingMarkupCalculator;
