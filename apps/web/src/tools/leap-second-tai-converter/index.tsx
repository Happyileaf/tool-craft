"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import { Alert, Card, Input, Radio, Table, Tag, Typography } from "antd";
import {
  LEAP_SECONDS,
  LATEST_LEAP_DATE,
  LATEST_OFFSET,
  convertFromTai,
  convertFromUnix,
  type ConversionResult,
} from "./utils/leapSeconds";
import {
  DEFAULT_INPUT,
  DIRECTION_OPTIONS,
  type ConvertDirection,
} from "./constants";
import styles from "./index.module.css";

const { Text } = Typography;

const LeapSecondTaiConverter: React.FC<ToolComponentProps> = ({
  defaultInput,
}) => {
  const [direction, setDirection] =
    React.useState<ConvertDirection>("fromUnix");
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result: ConversionResult = React.useMemo(
    () =>
      direction === "fromUnix" ? convertFromUnix(input) : convertFromTai(input),
    [direction, input],
  );

  const activeHint = DIRECTION_OPTIONS.find(
    (option) => option.value === direction,
  )?.hint;

  const tableColumns = [
    { title: "生效日 (UTC)", dataIndex: "date", key: "date" },
    { title: "Unix 零点 (s)", dataIndex: "at", key: "at" },
    { title: "TAI−UTC (s)", dataIndex: "offset", key: "offset" },
  ];

  return (
    <div className={styles.container}>
      <Card title="输入">
        <div className={styles.toolbar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            options={DIRECTION_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={(e) => setDirection(e.target.value as ConvertDirection)}
          />
          <span className={styles.hint}>{activeHint}</span>
        </div>
        <Input
          style={{ marginTop: 12, fontFamily: "var(--font-mono, monospace)" }}
          size="large"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          placeholder="秒级时间戳，支持小数，例如 1483228800"
          spellCheck={false}
        />
      </Card>

      {result.error ? (
        <Alert type="warning" showIcon message={result.error} />
      ) : null}

      <div className={styles.results}>
        <Card className={styles.resultCard}>
          <div className={styles.resultLabel}>Unix 时间戳（UTC 常规秒）</div>
          <div className={styles.resultValue}>{result.unix ?? "—"}</div>
        </Card>
        <Card className={styles.resultCard}>
          <div className={styles.resultLabel}>TAI 时间戳（TAI 秒）</div>
          <div className={styles.resultValue}>{result.tai ?? "—"}</div>
        </Card>
        <Card className={styles.resultCard}>
          <div className={styles.resultLabel}>TAI − UTC 偏移</div>
          <div className={styles.resultValue}>
            {result.offset === null ? "—" : `${result.offset} 秒`}
          </div>
        </Card>
        <Card className={styles.resultCard}>
          <div className={styles.resultLabel}>UTC 日期时间</div>
          <div className={styles.resultValue}>{result.utcText || "—"}</div>
        </Card>
        <Card className={`${styles.resultCard} ${styles.fullWidth}`}>
          <div className={styles.resultLabel}>闰秒标记</div>
          {result.leapDay ? (
            <Tag color="orange">
              闰秒生效日附近：{result.leapDay.date} 起 TAI−UTC ={" "}
              {result.leapDay.offset}s（当日含 23:59:60）
            </Tag>
          ) : (
            <Text type="secondary">该时刻不在任何闰秒插入日</Text>
          )}
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message={`闰秒表覆盖 1972-01-01 至 ${LATEST_LEAP_DATE}，共 ${LEAP_SECONDS.length} 条记录（27 次正闰秒），当前 TAI−UTC = ${LATEST_OFFSET} 秒。最后一条之后的日期按 ${LATEST_OFFSET}s 外推；IERS 公告新闰秒后需更新数据表。`}
      />

      <Card title="IERS 历史闰秒表" size="small">
        <div className={styles.tableWrap}>
          <Table
            className={styles.leapTable}
            rowKey="at"
            size="small"
            pagination={false}
            columns={tableColumns}
            dataSource={[...LEAP_SECONDS]}
          />
        </div>
      </Card>
    </div>
  );
};

export default LeapSecondTaiConverter;
