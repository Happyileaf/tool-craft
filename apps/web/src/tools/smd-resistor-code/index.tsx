"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { ClearOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { decodeSmdCode, encodeSmdCode, formatOhms } from "./utils/smd";
import { DEFAULT_SMD_CODE, KIND_NAMES_ZH, SMD_EXAMPLES } from "./constants";
import styles from "./index.module.css";

/**
 * SMD 贴片电阻阻值码计算器：解码 3 位数字码、4 位数字码与 EIA-96 字母码，
 * 并可由目标阻值反查最接近的标准印字码；全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns SMD 电阻码计算交互界面
 */
const SmdResistorCode: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [raw, setRaw] = React.useState<string>(
    defaultInput || DEFAULT_SMD_CODE,
  );
  const [targetOhms, setTargetOhms] = React.useState<number | null>(4700);

  const result = React.useMemo(() => decodeSmdCode(raw), [raw]);

  const candidates = React.useMemo(
    () =>
      targetOhms !== null && targetOhms > 0 ? encodeSmdCode(targetOhms) : [],
    [targetOhms],
  );

  return (
    <div className={styles.container}>
      <Card title="SMD 电阻印字码解码">
        <p className={styles.hint}>
          输入电阻表面印字，自动识别 3 位数字码（±5%）、4
          位数字码（±1%）、EIA-96 字母码（±1%）与 R 小数点位置码（如
          R10、10R0）。计算仅在浏览器本地完成。
        </p>
        <Input
          size="large"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="输入印字码，如 472、4701、47A、R10"
          prefix={<ThunderboltOutlined />}
          className={styles.codeInput}
          allowClear
        />
        <Space wrap style={{ marginTop: 12 }}>
          <span className={styles.label}>示例：</span>
          {SMD_EXAMPLES.map((example) => (
            <Button
              key={example.value}
              size="small"
              onClick={() => setRaw(example.value)}
            >
              {example.label}
            </Button>
          ))}
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={() => setRaw("")}
          >
            清空
          </Button>
        </Space>

        <div style={{ marginTop: 16 }}>
          {!raw.trim() ? (
            <Alert type="info" showIcon message="请输入电阻表面印字码" />
          ) : result.ok ? (
            <Alert
              type="success"
              showIcon
              message={`解码成功：${formatOhms(result.ohms ?? 0)}`}
              description={
                <span>
                  体系：{result.kind ? KIND_NAMES_ZH[result.kind] : "—"}
                  {result.tolerance ? `；典型精度 ${result.tolerance}` : ""}
                </span>
              }
            />
          ) : (
            <Alert
              type="error"
              showIcon
              message="无法识别的印字码"
              description={result.reason}
            />
          )}
        </div>

        <Descriptions
          size="small"
          bordered
          column={1}
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item label="电阻值">
            {result.ok && result.ohms !== null ? (
              <>
                <Tag color="blue">{formatOhms(result.ohms)}</Tag>
                <span className={styles.muted}>
                  {result.ohms.toLocaleString("en-US")} Ω
                </span>
              </>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="标记体系 / 精度">
            {result.ok ? (
              <>
                <Tag>{result.kind ? KIND_NAMES_ZH[result.kind] : "—"}</Tag>
                {result.tolerance ? (
                  <span className={styles.muted}>{result.tolerance}</span>
                ) : null}
              </>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="按目标阻值反查印字码">
        <p className={styles.hint}>
          输入期望阻值（欧姆），在 3 位码、4 位码与 EIA-96
          三个标准系列中搜索相对偏差最小的印字码。
        </p>
        <Space wrap align="center">
          <span className={styles.label}>目标阻值（Ω）：</span>
          <InputNumber
            size="large"
            min={0.0001}
            max={1e11}
            step={100}
            value={targetOhms}
            onChange={(value) =>
              setTargetOhms(typeof value === "number" ? value : null)
            }
            className={styles.targetInput}
          />
          <Button
            size="small"
            onClick={() => {
              setTargetOhms(4700);
              setRaw("472");
            }}
          >
            载入 4700 Ω 示例
          </Button>
        </Space>

        <Table
          style={{ marginTop: 16 }}
          size="small"
          pagination={false}
          rowKey={(row) => row.kind}
          dataSource={candidates}
          columns={[
            {
              title: "印字码",
              dataIndex: "code",
              render: (code: string) => (
                <Tag color="geekblue" className={styles.monoTag}>
                  {code}
                </Tag>
              ),
            },
            {
              title: "体系",
              dataIndex: "kind",
              render: (kind: string) => KIND_NAMES_ZH[kind] ?? kind,
            },
            {
              title: "实际阻值",
              dataIndex: "ohms",
              render: (ohms: number) => formatOhms(ohms),
            },
            {
              title: "相对偏差",
              dataIndex: "deviationPct",
              render: (pct: number) => (
                <span className={pct === 0 ? styles.exact : ""}>
                  {pct === 0 ? "精确匹配（0%）" : `${pct.toFixed(2)}%`}
                </span>
              ),
            },
            {
              title: "操作",
              key: "action",
              render: (_, row) => (
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    setRaw(row.code);
                    message.success(`已载入印字码 ${row.code}`);
                  }}
                >
                  载入解码
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default SmdResistorCode;
