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
  Table,
  Tag,
  message,
} from "antd";
import {
  ClearOutlined,
  CopyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  DEFAULT_COUNT,
  DEFAULT_INT_MAX,
  DEFAULT_INT_MIN,
  MAX_COUNT,
  RandomTypeEnum,
} from "./constants";
import { generateRandomData } from "./utils/generate";
import type { RandomGenerateOptions } from "./utils/generate";
import styles from "./index.module.css";

/**
 * 类型下拉选项，value 与 RandomTypeEnum 对应
 */
const TYPE_OPTIONS: { label: string; value: RandomTypeEnum }[] = [
  { label: "整数 Integer", value: RandomTypeEnum.Integer },
  { label: "浮点数 Float", value: RandomTypeEnum.Float },
  { label: "布尔值 Boolean", value: RandomTypeEnum.Boolean },
  { label: "十六进制颜色 Hex Color", value: RandomTypeEnum.HexColor },
  { label: "RGB 颜色", value: RandomTypeEnum.RgbColor },
  { label: "UUID v4", value: RandomTypeEnum.Uuid },
  { label: "英文姓名 Name", value: RandomTypeEnum.Name },
  { label: "电子邮箱 Email", value: RandomTypeEnum.Email },
  { label: "手机号 Phone", value: RandomTypeEnum.Phone },
  { label: "英文单词 Word", value: RandomTypeEnum.Word },
  { label: "Lorem 段落 Paragraph", value: RandomTypeEnum.Paragraph },
  { label: "日期时间 DateTime", value: RandomTypeEnum.DateTime },
];

/**
 * 需要展示数值范围配置的类型
 */
const RANGE_TYPES: ReadonlySet<RandomTypeEnum> = new Set([
  RandomTypeEnum.Integer,
  RandomTypeEnum.Float,
]);

/**
 * 随机数据生成器：基于 crypto.getRandomValues 在浏览器本地批量生成
 * 整数、浮点、布尔、颜色、UUID、姓名、邮箱、手机、单词与日期等模拟数据
 *
 * @param _props - 工具组件属性（本工具无默认样例输入）
 * @returns 随机数据生成交互界面
 */
const RandomDataGenerator: React.FC<ToolComponentProps> = () => {
  const [type, setType] = React.useState<RandomTypeEnum>(
    RandomTypeEnum.Integer,
  );
  const [count, setCount] = React.useState<number>(DEFAULT_COUNT);
  const [intMin, setIntMin] = React.useState<number>(DEFAULT_INT_MIN);
  const [intMax, setIntMax] = React.useState<number>(DEFAULT_INT_MAX);
  const [floatMin, setFloatMin] = React.useState<number>(0);
  const [floatMax, setFloatMax] = React.useState<number>(100);
  const [decimals, setDecimals] = React.useState<number>(2);
  const [results, setResults] = React.useState<string[]>([]);

  /**
   * 依据当前表单状态组装生成参数
   */
  const buildOptions = React.useCallback(
    (overrideCount?: number): RandomGenerateOptions => ({
      type,
      count: overrideCount ?? count,
      intMin,
      intMax,
      floatMin,
      floatMax,
      decimals,
    }),
    [type, count, intMin, intMax, floatMin, floatMax, decimals],
  );

  /**
   * 执行一次批量生成
   */
  const handleGenerate = React.useCallback(() => {
    const safeCount = Math.min(MAX_COUNT, Math.max(1, Math.floor(count) || 1));
    if (type === RandomTypeEnum.Integer && intMin > intMax) {
      message.warning("整数下限不能大于上限");
      return;
    }
    if (type === RandomTypeEnum.Float && floatMin >= floatMax) {
      message.warning("浮点下限需小于上限");
      return;
    }
    setResults(generateRandomData(buildOptions(safeCount)));
  }, [buildOptions, count, type, intMin, intMax, floatMin, floatMax]);

  /**
   * 复制全部结果（每行一条）
   */
  const copyAll = React.useCallback(() => {
    if (results.length === 0) {
      message.warning("暂无可复制的内容，请先生成");
      return;
    }
    navigator.clipboard
      .writeText(results.join("\n"))
      .then(() => message.success(`已复制 ${results.length} 条结果`))
      .catch(() => message.error("复制失败，请手动选择复制"));
  }, [results]);

  /**
   * 复制单行结果
   */
  const copyRow = React.useCallback((value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => message.success("已复制"))
      .catch(() => message.error("复制失败，请手动选择复制"));
  }, []);

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      width: 64,
      render: (value: number) => <span className={styles.muted}>{value}</span>,
    },
    {
      title: "值",
      dataIndex: "value",
      render: (value: string) => <span className={styles.resultBox}>{value}</span>,
    },
    {
      title: "操作",
      key: "action",
      width: 96,
      render: (_: unknown, record: { value: string }) => (
        <Button
          size="small"
          type="link"
          icon={<CopyOutlined />}
          onClick={() => copyRow(record.value)}
        >
          复制
        </Button>
      ),
    },
  ];

  const dataSource = results.map((value, index) => ({
    key: `${index}-${value}`,
    index: index + 1,
    value,
  }));

  return (
    <div className={styles.container}>
      <Card title="随机数据生成器（Random Data Generator）">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="所有随机值均由浏览器 crypto.getRandomValues 加密安全随机源在本地生成，不上传任何数据。"
        />
        <div className={styles.controls}>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>数据类型</span>
            <Select<RandomTypeEnum>
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
              style={{ width: 220 }}
            />
          </div>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>生成条数（1-{MAX_COUNT}）</span>
            <InputNumber
              min={1}
              max={MAX_COUNT}
              value={count}
              onChange={(value) => setCount(value ?? DEFAULT_COUNT)}
              style={{ width: 140 }}
            />
          </div>
          {type === RandomTypeEnum.Integer && (
            <>
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>最小值</span>
                <InputNumber
                  value={intMin}
                  onChange={(value) => setIntMin(value ?? 0)}
                  style={{ width: 130 }}
                />
              </div>
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>最大值</span>
                <InputNumber
                  value={intMax}
                  onChange={(value) => setIntMax(value ?? 0)}
                  style={{ width: 130 }}
                />
              </div>
            </>
          )}
          {type === RandomTypeEnum.Float && (
            <>
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>最小值</span>
                <InputNumber
                  value={floatMin}
                  onChange={(value) => setFloatMin(value ?? 0)}
                  style={{ width: 120 }}
                />
              </div>
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>最大值</span>
                <InputNumber
                  value={floatMax}
                  onChange={(value) => setFloatMax(value ?? 0)}
                  style={{ width: 120 }}
                />
              </div>
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>小数位</span>
                <InputNumber
                  min={0}
                  max={10}
                  value={decimals}
                  onChange={(value) => setDecimals(value ?? 2)}
                  style={{ width: 100 }}
                />
              </div>
            </>
          )}
          <div className={styles.controlItem}>
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleGenerate}
              >
                生成
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={() => setResults([])}
                disabled={results.length === 0}
              >
                清空结果
              </Button>
            </Space>
          </div>
        </div>

        {RANGE_TYPES.has(type) && (
          <p className={styles.hint} style={{ marginTop: 12, marginBottom: 0 }}>
            整数结果包含上下限端点；浮点结果落在 [最小值, 最大值) 区间并四舍五入到设定小数位。
          </p>
        )}
      </Card>

      {results.length > 0 && (
        <Card
          title={
            <Space wrap>
              <span>生成结果</span>
              <Tag color="blue">共 {results.length} 条</Tag>
            </Space>
          }
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={copyAll}
            >
              复制全部
            </Button>
          }
        >
          <Table
            size="small"
            columns={columns}
            dataSource={dataSource}
            pagination={results.length > 20 ? { pageSize: 20 } : false}
            scroll={{ y: 420 }}
          />
        </Card>
      )}
    </div>
  );
};

export default RandomDataGenerator;
