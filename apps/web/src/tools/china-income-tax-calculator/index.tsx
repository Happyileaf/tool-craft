"use client";

import React from "react";
import { Alert, Card, Input, Radio, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ToolComponentProps } from "../loaders";
import {
  MODULE_OPTIONS,
  TaxModuleEnum,
  DEFAULT_ANNUAL,
  DEFAULT_MONTHLY,
  ANNUAL_FIELD_META,
  MONTHLY_FIELD_META,
} from "./constants";
import {
  calcAnnualComprehensiveTax,
  calcBonusSeparate,
  compareBonusOptions,
  buildWithholdingSchedule,
  formatRate,
  formatMoney,
  type WithholdingRow,
} from "./utils/tax";
import styles from "./index.module.css";

function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

function parseAmount(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

const Metric: React.FC<{ label: string; value: string; note?: string }> = ({
  label,
  value,
  note,
}) => (
  <div className={styles.metric}>
    <span className={styles.metricLabel}>{label}</span>
    <span className={styles.metricValue}>{value}</span>
    {note && <span className={styles.hint}>{note}</span>}
  </div>
);

const withholdingColumns: ColumnsType<WithholdingRow> = [
  { title: "月份", dataIndex: "month", key: "month", width: 80, render: (m: number) => `${m} 月` },
  {
    title: "累计应纳税所得额",
    dataIndex: "cumulativeTaxable",
    key: "cumulativeTaxable",
    render: (v: number) => formatMoney(v),
  },
  {
    title: "累计应预扣税额",
    dataIndex: "cumulativeTax",
    key: "cumulativeTax",
    render: (v: number) => formatMoney(v),
  },
  {
    title: "本月预扣税额",
    dataIndex: "taxThisMonth",
    key: "taxThisMonth",
    render: (v: number) => formatMoney(v),
  },
  {
    title: "本月税后到手",
    dataIndex: "afterTaxThisMonth",
    key: "afterTaxThisMonth",
    render: (v: number) => formatMoney(v),
  },
];

const ChinaIncomeTaxCalculator: React.FC<ToolComponentProps> = () => {
  const [module, setModule] = React.useState<TaxModuleEnum>(TaxModuleEnum.ANNUAL);
  const [annualValues, setAnnualValues] = React.useState(DEFAULT_ANNUAL);
  const [monthlyValues, setMonthlyValues] = React.useState(DEFAULT_MONTHLY);

  const updateAnnual =
    (key: keyof typeof DEFAULT_ANNUAL) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setAnnualValues((prev) => ({ ...prev, [key]: e.target.value }));
    };
  const updateMonthly =
    (key: keyof typeof DEFAULT_MONTHLY) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setMonthlyValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const annualResult = React.useMemo(() => {
    const grossAnnual = parseAmount(annualValues.grossAnnual);
    const socialSecurity = parseAmount(annualValues.socialSecurity);
    const specialDeduction = parseAmount(annualValues.specialDeduction);
    const otherDeduction = parseAmount(annualValues.otherDeduction);
    if ([grossAnnual, socialSecurity, specialDeduction, otherDeduction].some((v) => v === null)) {
      return { error: "请完整填写年度参数（单位：元）" };
    }
    return calcAnnualComprehensiveTax({
      grossAnnual: grossAnnual as number,
      socialSecurity: socialSecurity as number,
      specialDeduction: specialDeduction as number,
      otherDeduction: otherDeduction as number,
    });
  }, [annualValues]);

  const bonusComparison = React.useMemo(() => {
    const grossAnnual = parseAmount(annualValues.grossAnnual);
    const socialSecurity = parseAmount(annualValues.socialSecurity);
    const specialDeduction = parseAmount(annualValues.specialDeduction);
    const otherDeduction = parseAmount(annualValues.otherDeduction);
    const bonus = parseAmount(annualValues.bonus);
    if ([grossAnnual, socialSecurity, specialDeduction, otherDeduction, bonus].some((v) => v === null)) {
      return { error: "请完整填写年度参数与奖金金额（单位：元）" };
    }
    return compareBonusOptions(
      {
        grossAnnual: grossAnnual as number,
        socialSecurity: socialSecurity as number,
        specialDeduction: specialDeduction as number,
        otherDeduction: otherDeduction as number,
      },
      bonus as number,
    );
  }, [annualValues]);

  const separatePreview = React.useMemo(() => {
    const bonus = parseAmount(annualValues.bonus);
    if (bonus === null) {
      return null;
    }
    return calcBonusSeparate(bonus);
  }, [annualValues.bonus]);

  const schedule = React.useMemo(() => {
    const monthlyGross = parseAmount(monthlyValues.monthlyGross);
    const monthlySocial = parseAmount(monthlyValues.monthlySocial);
    const monthlySpecial = parseAmount(monthlyValues.monthlySpecial);
    if ([monthlyGross, monthlySocial, monthlySpecial].some((v) => v === null)) {
      return { error: "请完整填写月度参数（单位：元/月）" };
    }
    return buildWithholdingSchedule(
      monthlyGross as number,
      monthlySocial as number,
      monthlySpecial as number,
    );
  }, [monthlyValues]);

  return (
    <div className={styles.container}>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={module}
        options={MODULE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(e) => setModule(e.target.value as TaxModuleEnum)}
      />

      {module !== TaxModuleEnum.WITHHOLDING && (
        <Card title="年度参数（工资薪金，单位：元）">
          <div className={styles.formGrid}>
            {ANNUAL_FIELD_META.map((field) => (
              <div key={field.key} className={styles.field}>
                <span className={styles.label}>{field.label}</span>
                <Input
                  inputMode="decimal"
                  value={annualValues[field.key]}
                  onChange={updateAnnual(field.key)}
                />
                <span className={styles.hint}>{field.hint}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {module === TaxModuleEnum.ANNUAL && (
        <Card title="年度综合所得个税测算">
          {isError(annualResult) ? (
            <Alert type="error" showIcon message={annualResult.error} />
          ) : (
            <div className={styles.resultGrid}>
              <Metric label="扣除合计" value={formatMoney(annualResult.totalDeduction)} note="含基本减除费用 60,000 元" />
              <Metric label="应纳税所得额" value={formatMoney(annualResult.taxableIncome)} />
              <Metric label="年度应纳税额" value={formatMoney(annualResult.tax)} />
              <Metric label="税后到手" value={formatMoney(annualResult.afterTax)} note="已扣社保公积金与个税" />
              <Metric
                label="适用税率 / 速算扣除"
                value={formatRate(annualResult.bracket.rate)}
                note={`速算扣除数 ${formatMoney(annualResult.bracket.quickDeduction)} 元`}
              />
            </div>
          )}
        </Card>
      )}

      {module === TaxModuleEnum.BONUS && (
        <Card title="全年一次性奖金：单独计税 vs 并入综合所得">
          {isError(bonusComparison) ? (
            <Alert type="error" showIcon message={bonusComparison.error} />
          ) : (
            <>
              <div className={styles.compareGrid}>
                <div
                  className={`${styles.optionCard} ${
                    bonusComparison.recommended === "separate" ? styles.optionCardRecommended : ""
                  }`}
                >
                  <div className={styles.optionTitle}>
                    <span>方案 A：单独计税</span>
                    {bonusComparison.recommended === "separate" && <Tag color="success">推荐</Tag>}
                  </div>
                  <span className={styles.optionLine}>
                    奖金个税：{formatMoney(bonusComparison.separate.bonusTax)} 元
                  </span>
                  <span className={styles.optionLine}>
                    全年合计个税：{formatMoney(bonusComparison.separate.totalTax)} 元
                  </span>
                  <span className={styles.optionLine}>
                    全年税后到手：{formatMoney(bonusComparison.separate.totalAfterTax)} 元
                  </span>
                </div>
                <div
                  className={`${styles.optionCard} ${
                    bonusComparison.recommended === "combined" ? styles.optionCardRecommended : ""
                  }`}
                >
                  <div className={styles.optionTitle}>
                    <span>方案 B：并入综合所得</span>
                    {bonusComparison.recommended === "combined" && <Tag color="success">推荐</Tag>}
                  </div>
                  <span className={styles.optionLine}>
                    奖金对应个税：{formatMoney(bonusComparison.combined.bonusTax)} 元
                  </span>
                  <span className={styles.optionLine}>
                    全年合计个税：{formatMoney(bonusComparison.combined.totalTax)} 元
                  </span>
                  <span className={styles.optionLine}>
                    全年税后到手：{formatMoney(bonusComparison.combined.totalAfterTax)} 元
                  </span>
                </div>
              </div>
              <Alert
                style={{ marginTop: 16 }}
                type="info"
                showIcon
                message={`推荐「${
                  bonusComparison.recommended === "separate" ? "单独计税" : "并入综合所得"
                }」，该方案少缴个税 ${formatMoney(bonusComparison.saving)} 元；两方案税额相同默认推荐单独计税。`}
              />
              {separatePreview && !isError(separatePreview) && (
                <Alert
                  style={{ marginTop: 12 }}
                  type="warning"
                  showIcon
                  message={`单独计税口径：奖金 ÷ 12 = ${formatMoney(
                    separatePreview.monthlyAmount,
                  )} 元，适用税率 ${formatRate(separatePreview.rate)}，速算扣除数 ${formatMoney(
                    separatePreview.quickDeduction,
                  )} 元。注意 36000 / 144000 等临界点存在「多发 1 元、多缴上千元」的税收悬崖。`}
                />
              )}
            </>
          )}
        </Card>
      )}

      {module === TaxModuleEnum.WITHHOLDING && (
        <Card title="月度累计预扣预缴明细（按月均匀口径）">
          <div className={styles.formGrid} style={{ marginBottom: 16 }}>
            {MONTHLY_FIELD_META.map((field) => (
              <div key={field.key} className={styles.field}>
                <span className={styles.label}>{field.label}</span>
                <Input
                  inputMode="decimal"
                  value={monthlyValues[field.key]}
                  onChange={updateMonthly(field.key)}
                />
                <span className={styles.hint}>{field.hint}</span>
              </div>
            ))}
          </div>
          {isError(schedule) ? (
            <Alert type="error" showIcon message={schedule.error} />
          ) : (
            <Table<WithholdingRow>
              rowKey="month"
              size="small"
              pagination={false}
              columns={withholdingColumns}
              dataSource={schedule}
              scroll={{ x: 640 }}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default ChinaIncomeTaxCalculator;
