"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import { BankOutlined, ClearOutlined, CopyOutlined } from "@ant-design/icons";
import {
  describeRoutingPrefix,
  validateAbaBatch,
  validateAbaRtn,
} from "./utils/aba";
import type { AbaBatchLine } from "./utils/aba";
import { ABA_EXAMPLES, BATCH_SAMPLE, DEFAULT_ABA } from "./constants";
import styles from "./index.module.css";

/**
 * ABA 路由号码（RTN）校验：9 位数字按 3、7、1 循环加权和模 10 核验，
 * 拆解联邦储备路由符号、机构号与校验位，并支持多行批量校验，全部本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns ABA RTN 校验交互界面
 */
const AbaRoutingValidator: React.FC<ToolComponentProps> = ({
  defaultInput,
}) => {
  const [raw, setRaw] = React.useState<string>(defaultInput || DEFAULT_ABA);
  const [batchText, setBatchText] = React.useState<string>("");

  /** 单个号码校验结果 */
  const result = React.useMemo(() => validateAbaRtn(raw), [raw]);
  const hasInput = result.normalized.length > 0;

  /** 批量校验结果 */
  const batchLines = React.useMemo<AbaBatchLine[]>(
    () => validateAbaBatch(batchText),
    [batchText],
  );
  const validCount = batchLines.filter((line) => line.valid).length;

  /** 前缀含义描述 */
  const prefixDesc = result.frbDistrict
    ? describeRoutingPrefix(Number(result.frbDistrict))
    : null;

  /** 复制文本到剪贴板 */
  const copyText = (text: string, label: string) => {
    if (!text) {
      message.warning("暂无可复制的内容");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label}已复制`))
      .catch(() => message.error("复制失败，请手动选择复制"));
  };

  const batchColumns = [
    {
      title: "行",
      dataIndex: "line",
      width: 60,
    },
    {
      title: "路由号码",
      dataIndex: "normalized",
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: "结论",
      dataIndex: "valid",
      width: 90,
      render: (valid: boolean) => (
        <Tag color={valid ? "success" : "error"}>{valid ? "合法" : "非法"}</Tag>
      ),
    },
    {
      title: "原因 / 前缀含义",
      key: "reason",
      render: (_: unknown, record: AbaBatchLine) =>
        record.valid ? (
          <span className={styles.muted}>
            {record.frbDistrict
              ? describeRoutingPrefix(Number(record.frbDistrict))
              : ""}
          </span>
        ) : (
          <span className={styles.errorText}>{record.reason}</span>
        ),
    },
  ];

  const singleTab = (
    <div>
      <p className={styles.hint}>
        输入 9 位美国 ABA 路由号码（RTN，可含空格或短横线，如
        0210-0002-1），工具按 3·d1 + 7·d2 + 1·d3 循环加权和模 10
        核验末位，并检查前两位是否在 01–12 / 21–32 / 61–72 / 80
        合法范围；号码仅在浏览器本地校验。
      </p>
      <Input
        size="large"
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        placeholder="输入 9 位 ABA 路由号码，如 021000021"
        prefix={<BankOutlined />}
        className={styles.rtnInput}
        allowClear
      />
      <Space wrap style={{ marginTop: 12 }}>
        <span className={styles.label}>示例：</span>
        {ABA_EXAMPLES.map((example) => (
          <Button
            key={example.value}
            size="small"
            onClick={() => setRaw(example.value)}
            danger={example.invalid}
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
        {!hasInput ? (
          <Alert
            type="info"
            showIcon
            message="请输入 9 位 ABA 路由号码（RTN）"
          />
        ) : result.valid ? (
          <Alert
            type="success"
            showIcon
            message="ABA 路由号码校验通过"
            description={prefixDesc ?? "该号码加权校验位合法。"}
          />
        ) : (
          <Alert
            type="error"
            showIcon
            message="ABA 路由号码校验失败"
            description={result.reason}
          />
        )}
      </div>

      <Card size="small" title="号码结构拆解" style={{ marginTop: 16 }}>
        <Descriptions size="small" bordered column={1}>
          <Descriptions.Item label="结论">
            <Tag color={result.valid ? "success" : "error"}>
              {result.valid ? "合法" : "非法"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="前 4 位联邦路由符号">
            {result.federalRoutingSymbol ? (
              <span className={styles.mono}>{result.federalRoutingSymbol}</span>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="中 4 位机构标识">
            {result.institutionId ? (
              <span className={styles.mono}>{result.institutionId}</span>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="第 9 位校验位">
            {result.checkDigit ? (
              <span className={styles.mono}>{result.checkDigit}</span>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="规范化号码">
            <Space className={styles.copyRow} wrap>
              <span className={styles.mono}>{result.normalized || "—"}</span>
              <Button
                size="small"
                type="link"
                icon={<CopyOutlined />}
                disabled={!hasInput}
                onClick={() => copyText(result.normalized, "号码")}
              >
                复制
              </Button>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );

  const batchTab = (
    <div>
      <p className={styles.hint}>
        每行粘贴一个路由号码，空行自动跳过，表格逐行给出结论与失败原因。
      </p>
      <Input.TextArea
        rows={7}
        value={batchText}
        onChange={(event) => setBatchText(event.target.value)}
        placeholder={"021000021\n026009593\n021000022"}
        className={styles.batchInput}
      />
      <Space wrap style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => setBatchText(BATCH_SAMPLE)}>
          填入批量示例
        </Button>
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={() => setBatchText("")}
        >
          清空
        </Button>
      </Space>
      {batchLines.length > 0 && (
        <div className={styles.summaryBar} style={{ marginTop: 16 }}>
          <Space wrap>
            <Tag color="blue">共 {batchLines.length} 个</Tag>
            <Tag color="success">合法 {validCount}</Tag>
            <Tag color="error">非法 {batchLines.length - validCount}</Tag>
          </Space>
        </div>
      )}
      <Table
        size="small"
        rowKey={(record) => `${record.line}-${record.rawLine}`}
        columns={batchColumns}
        dataSource={batchLines}
        pagination={false}
        scroll={{ y: 360 }}
      />
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="ABA 银行路由号码（RTN）校验器">
        <Tabs
          items={[
            { key: "single", label: "单个校验", children: singleTab },
            { key: "batch", label: "批量校验", children: batchTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default AbaRoutingValidator;
