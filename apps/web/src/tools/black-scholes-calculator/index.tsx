"use client";

import React from "react";
import { Alert, Card, Input, Radio, Tag } from "antd";
import type { ToolComponentProps } from "../loaders";
import { OPTION_TYPE_OPTIONS, DEFAULT_INPUTS, FIELD_META, OptionTypeEnum } from "./constants";
import {
  priceBlackScholes,
  impliedVolatility,
  formatNum,
  type BsInput,
  type OptionType,
} from "./utils/blackScholes";
import styles from "./index.module.css";

function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

/** 解析普通数字或百分号（5% / 0.05 / 5 均支持），百分号语义按百分数处理 */
function parseRate(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") {
    return null;
  }
  const hasPercent = trimmed.endsWith("%");
  const numeric = Number(hasPercent ? trimmed.slice(0, -1) : trimmed);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return hasPercent ? numeric / 100 : numeric;
}

function parsePlain(text: string): number | null {
  const value = Number(text.trim());
  return text.trim() === "" || !Number.isFinite(value) ? null : value;
}

const Metric: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div className={styles.metric}>
    <span className={styles.metricLabel}>{label}</span>
    <span className={styles.metricValue}>{value}</span>
    {note && <span className={styles.hint}>{note}</span>}
  </div>
);

const BlackScholesCalculator: React.FC<ToolComponentProps> = () => {
  const [optionType, setOptionType] = React.useState<OptionType>(OptionTypeEnum.CALL);
  const [values, setValues] = React.useState(DEFAULT_INPUTS);

  const update = (key: keyof typeof DEFAULT_INPUTS) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const parsed = React.useMemo(() => {
    const spot = parsePlain(values.spot);
    const strike = parsePlain(values.strike);
    const rate = parseRate(values.rate);
    const volatility = parseRate(values.volatility);
    const maturity = parsePlain(values.maturity);
    const dividend = parseRate(values.dividend);
    const marketPrice = values.marketPrice.trim() === "" ? null : parsePlain(values.marketPrice);
    return { spot, strike, rate, volatility, maturity, dividend, marketPrice };
  }, [values]);

  const result = React.useMemo(() => {
    const { spot, strike, rate, volatility, maturity, dividend } = parsed;
    if ([spot, strike, rate, volatility, maturity, dividend].some((v) => v === null)) {
      return { error: "请完整填写全部参数（利率与波动率支持 5% 或 0.05 写法）" };
    }
    const input: BsInput = {
      spot: spot as number,
      strike: strike as number,
      rate: rate as number,
      volatility: volatility as number,
      maturity: maturity as number,
      dividend: dividend as number,
    };
    return priceBlackScholes(input, optionType);
  }, [parsed, optionType]);

  const ivResult = React.useMemo(() => {
    if (parsed.marketPrice === null) {
      return null;
    }
    const { spot, strike, rate, maturity, dividend } = parsed;
    if ([spot, strike, rate, maturity, dividend].some((v) => v === null)) {
      return { error: "反解隐含波动率需要完整的 S、K、r、T、q" };
    }
    return impliedVolatility(
      {
        spot: spot as number,
        strike: strike as number,
        rate: rate as number,
        maturity: maturity as number,
        dividend: dividend as number,
      },
      optionType,
      parsed.marketPrice,
    );
  }, [parsed, optionType]);

  return (
    <div className={styles.container}>
      <Card
        title="参数输入"
        extra={
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={optionType}
            options={OPTION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(e) => setOptionType(e.target.value as OptionType)}
          />
        }
      >
        <div className={styles.formGrid}>
          {FIELD_META.map((field) => (
            <div key={field.key} className={styles.field}>
              <span className={styles.label}>{field.label}</span>
              <Input value={values[field.key]} onChange={update(field.key)} />
              <span className={styles.hint}>{field.hint}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="定价与 Greeks（Black-Scholes-Merton）">
        {isError(result) ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <>
            <div className={styles.resultGrid}>
              <Metric label="理论价格" value={formatNum(result.price, 4)} />
              <Metric label="Delta Δ" value={formatNum(result.delta, 6)} note="标的价格变动 1 单位" />
              <Metric label="Gamma Γ" value={formatNum(result.gamma, 6)} note="Delta 的变化率" />
              <Metric label="Theta Θ" value={formatNum(result.theta, 6)} note="每日时间衰减" />
              <Metric label="Vega ν" value={formatNum(result.vega, 6)} note="波动率 +1% 的变化" />
              <Metric label="Rho ρ" value={formatNum(result.rho, 6)} note="利率 +1% 的变化" />
            </div>
            <div className={styles.greekNote}>
              <Tag>d1 = {formatNum(result.d1, 6)}</Tag>
              <Tag>d2 = {formatNum(result.d2, 6)}</Tag>
              <span style={{ marginLeft: 8 }}>Theta 按自然日折算，Vega / Rho 已按 1% 变动口径缩放。</span>
            </div>
          </>
        )}
      </Card>

      <Card title="隐含波动率反解（填写市场价格后自动计算）">
        {ivResult === null ? (
          <Alert type="info" showIcon message="在上方「市场价格」填入期权成交价，即可用二分法反解年化隐含波动率" />
        ) : isError(ivResult) ? (
          <Alert type="error" showIcon message={ivResult.error} />
        ) : (
          <Alert
            type="success"
            showIcon
            message={`隐含波动率 IV = ${formatNum(ivResult.impliedVolatility * 100, 4)}%`}
          />
        )}
      </Card>
    </div>
  );
};

export default BlackScholesCalculator;
