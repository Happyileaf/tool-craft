"use client";

import React from "react";
import {
  Alert,
  Card,
  Checkbox,
  InputNumber,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import type { ToolComponentProps } from "../loaders";
import {
  ANNUAL_BRACKETS,
  calculateAnnual,
  calculateBonusSeparate,
  calculateWithholding,
  round2,
  uniformMonthly,
  type AnnualIncomeInput,
  type MonthlySalaryInput,
} from "./utils/tax";
import {
  ANNUAL_BRACKET_RANGES,
  BASIC_MONTHLY,
  SPECIAL_DEDUCTION_OPTIONS,
  yuan,
} from "./constants";
import styles from "./index.module.css";

const numInput = { style: { width: "100%" } } as const;

const CnIncomeTaxCalculator: React.FC<ToolComponentProps> = () => {
  // ---- 月度预扣预缴 ----
  const [gross, setGross] = React.useState(30_000);
  const [social, setSocial] = React.useState(3_000);
  const [checkedDeductions, setCheckedDeductions] = React.useState<number[]>([1000]);
  const specialMonthly = checkedDeductions.reduce((s, v) => s + v, 0);

  const monthlyInputs: MonthlySalaryInput[] = React.useMemo(
    () => uniformMonthly(gross, social, specialMonthly),
    [gross, social, specialMonthly],
  );
  const withholding = React.useMemo(
    () => calculateWithholding(monthlyInputs, BASIC_MONTHLY),
    [monthlyInputs],
  );

  // ---- 年度汇算 ----
  const [annual, setAnnual] = React.useState<AnnualIncomeInput>({
    salary: 360_000,
    laborService: 0,
    authorRemuneration: 0,
    royalty: 0,
    socialInsurance: 36_000,
    specialDeduction: 12_000,
    otherDeduction: 0,
    prepaidTax: withholding.totalTax,
  });
  React.useEffect(() => {
    setAnnual((prev) => ({ ...prev, prepaidTax: withholding.totalTax }));
  }, [withholding.totalTax]);

  const settlement = React.useMemo(() => calculateAnnual(annual), [annual]);
  const [bonus, setBonus] = React.useState(36_000);
  const bonusResult = React.useMemo(() => calculateBonusSeparate(bonus), [bonus]);

  const monthlyColumns = [
    { title: "月份", dataIndex: "month", width: 64, render: (v: number) => `${v} 月` },
    {
      title: "累计收入",
      dataIndex: "cumulativeIncome",
      align: "right" as const,
      render: (v: number) => yuan(v),
    },
    {
      title: "累计扣除",
      dataIndex: "cumulativeDeduction",
      align: "right" as const,
      render: (v: number) => yuan(v),
    },
    {
      title: "累计应税额",
      dataIndex: "cumulativeTaxable",
      align: "right" as const,
      render: (v: number) => yuan(v),
    },
    {
      title: "税率",
      dataIndex: "rate",
      align: "right" as const,
      width: 80,
      render: (v: number) => `${v * 100}%`,
    },
    {
      title: "当月预扣税",
      dataIndex: "currentTax",
      align: "right" as const,
      render: (v: number) => <Typography.Text strong>{yuan(v)}</Typography.Text>,
    },
    {
      title: "税后到手",
      dataIndex: "netPay",
      align: "right" as const,
      render: (v: number) => yuan(v),
    },
  ];

  const bracketColumns = [
    { title: "级数", dataIndex: "level", width: 64 },
    { title: "全年应纳税所得额", dataIndex: "range" },
    {
      title: "税率",
      dataIndex: "rate",
      align: "right" as const,
      width: 80,
      render: (v: number) => `${v * 100}%`,
    },
    {
      title: "速算扣除数",
      dataIndex: "quick",
      align: "right" as const,
      render: (v: number) => yuan(v),
    },
  ];
  const bracketData = ANNUAL_BRACKETS.map((b, i) => ({
    key: i,
    level: i + 1,
    range: ANNUAL_BRACKET_RANGES[i] ?? "",
    rate: b.rate,
    quick: b.quickDeduction,
  }));

  const annualField = (
    key: keyof AnnualIncomeInput,
    label: string,
  ): React.ReactNode => (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <InputNumber
        {...numInput}
        min={0}
        value={annual[key] as number}
        onChange={(v) => setAnnual((p) => ({ ...p, [key]: v ?? 0 }))}
        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        parser={(v) => Number((v ?? "").replace(/[^0-9.]/g, "")) as 0}
      />
    </div>
  );

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="依据现行居民个人综合所得 7 级超额累进税率计算，工资按累计预扣法、年度按汇算清缴口径；结果仅供参考，申报以税务机关口径为准。"
      />

      <Tabs
        className={styles.tabs}
        items={[
          {
            key: "monthly",
            label: "工资月度预扣",
            children: (
              <div className={styles.panels}>
                <Card className={styles.card} title="月度收入与扣除">
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>税前月工资（元）</span>
                      <InputNumber
                        {...numInput}
                        min={0}
                        value={gross}
                        onChange={(v) => setGross(v ?? 0)}
                      />
                    </div>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>三险一金个人部分（元/月）</span>
                      <InputNumber
                        {...numInput}
                        min={0}
                        value={social}
                        onChange={(v) => setSocial(v ?? 0)}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <span className={styles.fieldLabel}>专项附加扣除（按月勾选，可叠加）</span>
                    <Checkbox.Group
                      className={styles.checklist}
                      style={{ marginTop: 8, display: "flex", flexDirection: "column" }}
                      value={checkedDeductions}
                      onChange={(vals) => setCheckedDeductions(vals as number[])}
                      options={SPECIAL_DEDUCTION_OPTIONS}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      每月基本减除费用 {BASIC_MONTHLY.toLocaleString()} 元自动计入；当前专项附加合计{" "}
                      {specialMonthly.toLocaleString()} 元/月。
                    </Typography.Text>
                  </div>

                  <div className={styles.summaryGrid} style={{ marginTop: 16 }}>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>全年税前收入</div>
                      <div className={styles.metricValue}>{yuan(withholding.totalGross)}</div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>全年社保合计</div>
                      <div className={styles.metricValue}>{yuan(withholding.totalSocial)}</div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>全年预扣个税</div>
                      <div className={`${styles.metricValue} ${styles.primary}`}>
                        {yuan(withholding.totalTax)}
                      </div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>全年税后到手</div>
                      <div className={`${styles.metricValue} ${styles.ok}`}>
                        {yuan(withholding.totalNet)}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className={styles.card} title="12 个月累计预扣明细">
                  <Table
                    size="small"
                    pagination={false}
                    scroll={{ y: 460 }}
                    rowKey="month"
                    columns={monthlyColumns}
                    dataSource={withholding.months}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "annual",
            label: "年度汇算清缴",
            children: (
              <div className={styles.panels}>
                <Card className={styles.card} title="年度综合所得与扣除">
                  <div className={styles.fieldGrid}>
                    {annualField("salary", "工资薪金合计（元）")}
                    {annualField("laborService", "劳务报酬合计（元）")}
                    {annualField("authorRemuneration", "稿酬合计（元）")}
                    {annualField("royalty", "特许权使用费合计（元）")}
                    {annualField("socialInsurance", "三险一金合计（元）")}
                    {annualField("specialDeduction", "专项附加扣除合计（元）")}
                    {annualField("otherDeduction", "其他扣除合计（元）")}
                    {annualField("prepaidTax", "已预扣预缴税额（元）")}
                  </div>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12 }}>
                    收入额换算：工资全额计入；劳务报酬/特许权按 80% 计入；稿酬按 80%×70%=56% 计入。
                    基本减除费用 60,000 元/年自动计入。
                  </Typography.Paragraph>

                  <div className={styles.summaryGrid}>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>计入收入额</div>
                      <div className={styles.metricValue}>
                        {yuan(settlement.taxableIncomeAmount)}
                      </div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>应纳税所得额</div>
                      <div className={styles.metricValue}>{yuan(settlement.taxable)}</div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>
                        年度应纳税额（{settlement.rate * 100}% 档，速扣{" "}
                        {yuan(settlement.quickDeduction)}）
                      </div>
                      <div className={`${styles.metricValue} ${styles.primary}`}>
                        {yuan(settlement.tax)}
                      </div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>
                        {settlement.balance >= 0 ? "应补税额" : "应退税额"}
                      </div>
                      <div
                        className={`${styles.metricValue} ${
                          settlement.balance >= 0 ? styles.warn : styles.ok
                        }`}
                      >
                        {yuan(Math.abs(settlement.balance))}
                        <Tag
                          color={settlement.balance >= 0 ? "red" : "green"}
                          style={{ marginLeft: 8 }}
                        >
                          {settlement.balance >= 0 ? "补税" : "退税"}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className={styles.card} title="税率表与年终奖单独计税">
                  <Table
                    className={styles.bracketTable}
                    size="small"
                    pagination={false}
                    rowKey="level"
                    columns={bracketColumns}
                    dataSource={bracketData}
                    rowClassName={(row) => {
                      const activeIndex = ANNUAL_BRACKETS.findIndex(
                        (b) =>
                          b.rate === settlement.rate &&
                          b.quickDeduction === settlement.quickDeduction,
                      );
                      return settlement.taxable > 0 && activeIndex === row.level - 1
                        ? (styles.active ?? "")
                        : "";
                    }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <span className={styles.fieldLabel}>全年一次性奖金（单独计税）</span>
                    <Space style={{ marginTop: 6, width: "100%" }}>
                      <InputNumber
                        style={{ width: 200 }}
                        min={0}
                        value={bonus}
                        onChange={(v) => setBonus(v ?? 0)}
                      />
                      <Tag color="blue">
                        月均 {yuan(bonusResult.monthlyBasis)} → {bonusResult.rate * 100}% 档
                      </Tag>
                    </Space>
                    <div className={styles.summaryGrid} style={{ marginTop: 12 }}>
                      <div className={styles.metric}>
                        <div className={styles.metricLabel}>奖金单独计税税额</div>
                        <div className={`${styles.metricValue} ${styles.primary}`}>
                          {yuan(bonusResult.tax)}
                        </div>
                      </div>
                      <div className={styles.metric}>
                        <div className={styles.metricLabel}>税后奖金</div>
                        <div className={`${styles.metricValue} ${styles.ok}`}>
                          {yuan(bonusResult.net)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CnIncomeTaxCalculator;
