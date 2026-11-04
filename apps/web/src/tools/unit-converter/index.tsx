"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Select,
  Space,
  Tabs,
  Typography,
  message,
} from "antd";
import { CopyOutlined, SwapOutlined } from "@ant-design/icons";
import { MAX_ABS_INPUT, UNIT_CATEGORIES } from "./constants";
import type { UnitCategoryDefinition, UnitDefinition } from "./constants";
import { convertBetweenUnits, roundResult } from "./utils/convert";

const { Text } = Typography;

/**
 * 单位换算器：在长度、质量、温度、面积、体积、速度、数据存储、时间、
 * 压强、角度、能量 11 个分类的常用单位之间进行纯本地线性换算
 *
 * @param _props - 工具组件属性（本工具无默认样例输入）
 * @returns 单位换算交互界面
 */
const UnitConverter: React.FC<ToolComponentProps> = () => {
  const [categoryId, setCategoryId] = React.useState<string>(
    UNIT_CATEGORIES[0]?.id ?? "",
  );
  const category = React.useMemo<UnitCategoryDefinition | undefined>(
    () => UNIT_CATEGORIES.find((item) => item.id === categoryId),
    [categoryId],
  );

  const [sourceUnitId, setSourceUnitId] = React.useState<string>(
    category?.units[0]?.id ?? "",
  );
  const [targetUnitId, setTargetUnitId] = React.useState<string>(
    category?.units[1]?.id ?? category?.units[0]?.id ?? "",
  );
  const [inputValue, setInputValue] = React.useState<number>(1);

  /**
   * 切换分类时把源/目标单位重置为该分类的前两个单位
   */
  const handleCategoryChange = React.useCallback((nextId: string) => {
    const next = UNIT_CATEGORIES.find((item) => item.id === nextId);
    setCategoryId(nextId);
    setSourceUnitId(next?.units[0]?.id ?? "");
    setTargetUnitId(next?.units[1]?.id ?? next?.units[0]?.id ?? "");
  }, []);

  const sourceUnit: UnitDefinition | undefined = React.useMemo(
    () => category?.units.find((unit) => unit.id === sourceUnitId),
    [category, sourceUnitId],
  );
  const targetUnit: UnitDefinition | undefined = React.useMemo(
    () => category?.units.find((unit) => unit.id === targetUnitId),
    [category, targetUnitId],
  );

  const result = React.useMemo<number | null>(() => {
    if (!sourceUnit || !targetUnit || !Number.isFinite(inputValue)) {
      return null;
    }
    if (Math.abs(inputValue) > MAX_ABS_INPUT) {
      return null;
    }
    return roundResult(convertBetweenUnits(inputValue, sourceUnit, targetUnit));
  }, [inputValue, sourceUnit, targetUnit]);

  /**
   * 交换源单位与目标单位，并以当前结果作为新输入，保证数值连续
   */
  const handleSwap = React.useCallback(() => {
    setSourceUnitId(targetUnitId);
    setTargetUnitId(sourceUnitId);
    if (result !== null) {
      setInputValue(result);
    }
  }, [sourceUnitId, targetUnitId, result]);

  /**
   * 复制主换算结果
   */
  const handleCopy = React.useCallback(() => {
    if (result === null) {
      message.warning("暂无可复制的结果");
      return;
    }
    navigator.clipboard
      .writeText(String(result))
      .then(() => message.success("已复制换算结果"))
      .catch(() => message.error("复制失败，请手动选择复制"));
  }, [result]);

  const unitOptions = React.useMemo(
    () =>
      (category?.units ?? []).map((unit) => ({
        label: `${unit.label}（${unit.symbol}）`,
        value: unit.id,
      })),
    [category],
  );

  /**
   * 计算固定输入值对当前分类所有单位的快速换算表
   */
  const quickConversions = React.useMemo(() => {
    if (!category || !sourceUnit || !Number.isFinite(inputValue)) {
      return [];
    }
    return category.units
      .filter((unit) => unit.id !== sourceUnit.id)
      .map((unit) => ({
        key: unit.id,
        label: `${unit.label}（${unit.symbol}）`,
        value: roundResult(convertBetweenUnits(inputValue, sourceUnit, unit)),
      }));
  }, [category, sourceUnit, inputValue]);

  const inputTooLarge = Math.abs(inputValue) > MAX_ABS_INPUT;

  return (
    <div className="space-y-4">
      <Card title="单位换算器（Unit Converter）">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="所有换算均在浏览器本地基于线性比例模型完成，不发起网络请求；温度单位通过平移量正确处理温标差异。"
        />
        <Tabs
          activeKey={categoryId}
          onChange={handleCategoryChange}
          items={UNIT_CATEGORIES.map((item) => ({
            key: item.id,
            label: item.label,
          }))}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              输入数值
            </Text>
            <InputNumber
              value={inputValue}
              onChange={(value) => setInputValue(value ?? 0)}
              style={{ width: 180 }}
              status={inputTooLarge ? "error" : undefined}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              源单位
            </Text>
            <Select
              value={sourceUnitId}
              onChange={setSourceUnitId}
              options={unitOptions}
              style={{ width: 200 }}
            />
          </div>
          <Button
            icon={<SwapOutlined />}
            onClick={handleSwap}
            style={{ paddingBottom: 4 }}
            aria-label="交换源单位与目标单位"
          >
            交换
          </Button>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              目标单位
            </Text>
            <Select
              value={targetUnitId}
              onChange={setTargetUnitId}
              options={unitOptions}
              style={{ width: 200 }}
            />
          </div>
        </div>

        {inputTooLarge && (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message={`输入绝对值不能超过 ${MAX_ABS_INPUT.toExponential()}，请调整后再换算`}
          />
        )}
      </Card>

      {result !== null && sourceUnit && targetUnit && (
        <Card
          title="换算结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制结果
            </Button>
          }
        >
          <div
            style={{
              background: "rgb(249 250 251)",
              border: "1px solid rgb(229 231 235)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 600 }}>
                {inputValue} {sourceUnit.symbol}
              </span>
              <span style={{ color: "rgb(107 114 128)" }}>=</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 600, color: "rgb(37 99 235)" }}>
                {result}
                <span style={{ marginLeft: 8, fontSize: 16, color: "rgb(75 85 99)" }}>
                  {targetUnit.symbol}
                </span>
              </span>
            </Space>
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "rgb(107 114 128)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {inputValue} {sourceUnit.label} → {result} {targetUnit.label}
            </div>
          </div>
        </Card>
      )}

      {quickConversions.length > 0 && !inputTooLarge && (
        <Card title={`同一输入对「${category?.label}」全部单位的换算`}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8,
            }}
          >
            {quickConversions.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 12px",
                  background: "rgb(249 250 251)",
                  border: "1px solid rgb(229 231 235)",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <span style={{ color: "rgb(75 85 99)" }}>{item.label}</span>
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    textAlign: "right",
                    wordBreak: "break-all",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default UnitConverter;
