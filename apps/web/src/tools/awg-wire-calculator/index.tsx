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
import { ClearOutlined } from "@ant-design/icons";
import {
  calculateAwg,
  formatAwg,
  nearestAwgByDiameter,
  parseAwg,
} from "./utils/awg";
import { AWG_EXAMPLES, DEFAULT_AWG } from "./constants";
import styles from "./index.module.css";

/**
 * AWG 美国线规计算器：由线号计算导体直径、截面积、20 ℃ 铜电阻与经验载流量，
 * 并支持由直径反查最接近的标准线号；全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns AWG 线规计算交互界面
 */
const AwgWireCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [raw, setRaw] = React.useState<string>(defaultInput || DEFAULT_AWG);
  const [targetDiameter, setTargetDiameter] = React.useState<number | null>(
    2.05,
  );

  const gauge = parseAwg(raw);
  const result = React.useMemo(() => calculateAwg(raw), [raw]);

  const nearest = React.useMemo(
    () =>
      targetDiameter !== null && targetDiameter > 0
        ? nearestAwgByDiameter(targetDiameter)
        : null,
    [targetDiameter],
  );

  // 生成对比表：常见线号 0-30
  const tableData = React.useMemo(
    () =>
      Array.from({ length: 31 }, (_, n) => ({
        n,
        ...calculateAwg(String(n)),
      })).filter((r) => r.ok),
    [],
  );

  return (
    <div className={styles.container}>
      <Card title="AWG 线号参数计算">
        <p className={styles.hint}>
          输入 AWG 线号（4/0、3/0、2/0、1/0 或 0–40），计算导体直径、截面积、20
          ℃
          退火铜电阻与机箱布线经验载流量。电阻为标准材料值，载流量随绝缘等级、成束方式与环境温度变化。
        </p>
        <Input
          size="large"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="输入线号，如 12、24、4/0"
          className={styles.gaugeInput}
          allowClear
        />
        <Space wrap style={{ marginTop: 12 }}>
          <span className={styles.label}>常见线号：</span>
          {AWG_EXAMPLES.map((example) => (
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
            <Alert type="info" showIcon message="请输入 AWG 线号" />
          ) : result.ok ? (
            <Alert
              type="success"
              showIcon
              message={`${gauge !== null ? formatAwg(gauge) : ""}：${result.diameterMm!.toFixed(3)} mm 直径`}
              description={`截面积 ${result.areaMm2!.toFixed(3)} mm²；电阻 ${result.ohmsPerKm!.toFixed(3)} Ω/km（20 ℃ 铜）；经验载流量约 ${result.ampacityA} A`}
            />
          ) : (
            <Alert
              type="error"
              showIcon
              message="无法识别的线号"
              description={result.reason}
            />
          )}
        </div>

        <Descriptions
          size="small"
          bordered
          column={2}
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item label="直径（mm）">
            {result.diameterMm !== null ? result.diameterMm.toFixed(4) : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="直径（inch）">
            {result.diameterIn !== null ? result.diameterIn.toFixed(5) : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="截面积（mm²）">
            {result.areaMm2 !== null ? result.areaMm2.toFixed(4) : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="截面积（kcmil）">
            {result.kcmil !== null ? result.kcmil.toFixed(3) : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="电阻（Ω/km）">
            {result.ohmsPerKm !== null ? (
              <Tag color="orange">{result.ohmsPerKm.toFixed(4)}</Tag>
            ) : (
              "—"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="电阻（Ω/1000 ft）">
            {result.ohmsPer1000Ft !== null
              ? result.ohmsPer1000Ft.toFixed(4)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="经验载流量（A）" span={2}>
            {result.ampacityA !== null ? (
              <Tag color="red">{result.ampacityA} A</Tag>
            ) : (
              "—"
            )}
            <span className={styles.muted}>
              （单根铜线机箱布线参考值，工程选型请查 NEC / 厂家手册）
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="按直径反查线号">
        <Space wrap align="center">
          <span className={styles.label}>导体直径（mm）：</span>
          <InputNumber
            size="large"
            min={0.05}
            max={15}
            step={0.01}
            value={targetDiameter}
            onChange={(value) =>
              setTargetDiameter(typeof value === "number" ? value : null)
            }
            className={styles.targetInput}
          />
        </Space>
        {nearest ? (
          <Alert
            style={{ marginTop: 16 }}
            type="success"
            showIcon
            message={`最接近 ${formatAwg(nearest.gauge)}（标准直径 ${nearest.diameterMm.toFixed(4)} mm，偏差 ${nearest.deviationPct.toFixed(2)}%）`}
            action={
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setRaw(
                    nearest.gauge < 0
                      ? `${nearest.gauge + 4}/0`
                      : String(nearest.gauge),
                  );
                  message.success("已载入该线号");
                }}
              >
                载入
              </Button>
            }
          />
        ) : (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="请输入正数直径（mm）"
          />
        )}
      </Card>

      <Card title="常见线号速查表（20 ℃ 退火铜）">
        <Table
          size="small"
          pagination={false}
          rowKey="n"
          dataSource={tableData}
          columns={[
            {
              title: "AWG",
              dataIndex: "n",
              render: (n: number) => formatAwg(n),
              width: 110,
            },
            {
              title: "直径 (mm)",
              dataIndex: "diameterMm",
              render: (v: number) => v.toFixed(3),
            },
            {
              title: "面积 (mm²)",
              dataIndex: "areaMm2",
              render: (v: number) => v.toFixed(3),
            },
            {
              title: "Ω/km",
              dataIndex: "ohmsPerKm",
              render: (v: number) => v.toFixed(3),
            },
            {
              title: "载流量 (A)",
              dataIndex: "ampacityA",
              render: (v: number) => v,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AwgWireCalculator;
