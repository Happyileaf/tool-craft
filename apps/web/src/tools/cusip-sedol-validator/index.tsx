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
  Tag,
  message,
} from "antd";
import {
  ClearOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { validateSecurityId } from "./utils/cusipSedol";
import { DEFAULT_SECURITY_ID, SECURITY_ID_EXAMPLES } from "./constants";
import styles from "./index.module.css";

/**
 * CUSIP / SEDOL 证券识别码校验：按长度自动判别体系（9 位 CUSIP / 7 位 SEDOL），
 * 依据官方模 10 加权算法核验末位校验位，全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns CUSIP / SEDOL 校验交互界面
 */
const CusipSedolValidator: React.FC<ToolComponentProps> = ({
  defaultInput,
}) => {
  const [raw, setRaw] = React.useState<string>(
    defaultInput || DEFAULT_SECURITY_ID,
  );

  /** 完整校验结果（内部自动去除空格与短横线并转大写） */
  const result = React.useMemo(() => validateSecurityId(raw), [raw]);

  const hasInput = result.normalized.length > 0;

  /** 复制文本到剪贴板，并给出轻提示 */
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

  return (
    <div className={styles.container}>
      <Card title="CUSIP / SEDOL 证券识别码校验">
        <p className={styles.hint}>
          输入 9 位 CUSIP（北美证券）或 7 位 SEDOL（英国 /
          爱尔兰证券），工具按长度自动判别体系，
          去除空格与短横线并转大写后核验末位校验位；识别码仅在浏览器本地校验，不会上传。
        </p>
        <Input
          size="large"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="输入 CUSIP（9 位，如 037833100）或 SEDOL（7 位，如 0263494）"
          prefix={<SafetyCertificateOutlined />}
          className={styles.codeInput}
          allowClear
        />
        <Space wrap style={{ marginTop: 12 }}>
          <span className={styles.label}>示例：</span>
          {SECURITY_ID_EXAMPLES.map((example) => (
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
              message="请输入 CUSIP（9 位）或 SEDOL（7 位）"
            />
          ) : result.valid ? (
            <Alert
              type="success"
              showIcon
              message={`${result.kind} 校验通过`}
              description={`该 ${result.kind} 识别码合法，末位校验位 ${result.actualCheck} 与加权计算结果一致。`}
            />
          ) : (
            <Alert
              type="error"
              showIcon
              message={`${result.kind ?? "识别码"} 校验失败`}
              description={result.reason}
            />
          )}
        </div>
      </Card>

      <Card title="校验结果明细">
        <Descriptions size="small" bordered column={1}>
          <Descriptions.Item label="结论">
            <Tag color={result.valid ? "success" : "error"}>
              {result.valid ? "合法" : "非法"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="识别体系">
            {result.kind ? (
              <>
                <Tag color="blue">{result.kind}</Tag>
                {result.kind === "CUSIP"
                  ? "北美证券识别码（9 位）"
                  : "英爱证券识别码（7 位）"}
              </>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="规范化结果（去空格、大写）">
            <Space className={styles.copyRow} wrap>
              <span className={styles.mono}>{result.normalized || "—"}</span>
              <Button
                size="small"
                type="link"
                icon={<CopyOutlined />}
                disabled={!hasInput}
                onClick={() => copyText(result.normalized, "规范化识别码")}
              >
                复制
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="实际校验位 / 期望校验位">
            {hasInput && result.actualCheck ? (
              <span className={styles.mono}>
                末位 {result.actualCheck}
                {result.expectedCheck ? ` / 应为 ${result.expectedCheck}` : ""}
              </span>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="失败原因">
            {result.reason ? (
              <span className={result.valid ? styles.muted : styles.errorText}>
                {result.reason}
              </span>
            ) : (
              <span className={styles.muted}>无</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default CusipSedolValidator;
