"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { generateCorsHeaders } from "./utils/cors";
import {
  COMMON_METHODS,
  DEFAULT_ALLOWED_HEADERS,
  DEFAULT_MAX_AGE,
  DEFAULT_METHODS,
  ORIGIN_MODE_OPTIONS,
  type OriginMode,
} from "./constants";
import { copyToClipboard } from "@/lib/utils";
import styles from "./index.module.css";

const splitCsv = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const CorsHeaderGenerator: React.FC<ToolComponentProps> = () => {
  const [originMode, setOriginMode] = React.useState<OriginMode>("wildcard");
  const [originsText, setOriginsText] = React.useState("https://example.com");
  const [credentials, setCredentials] = React.useState(false);
  const [methods, setMethods] = React.useState<string[]>(
    splitCsv(DEFAULT_METHODS),
  );
  const [allowedHeadersText, setAllowedHeadersText] = React.useState(
    DEFAULT_ALLOWED_HEADERS,
  );
  const [exposeHeadersText, setExposeHeadersText] =
    React.useState("X-Request-Id");
  const [maxAgeText, setMaxAgeText] = React.useState(DEFAULT_MAX_AGE);

  const maxAgeParsed = maxAgeText.trim() === "" ? null : Number(maxAgeText);

  const result = React.useMemo(
    () =>
      generateCorsHeaders({
        originMode,
        origins: originsText.split("\n"),
        credentials,
        methods,
        allowedHeaders: splitCsv(allowedHeadersText),
        maxAge: Number.isFinite(maxAgeParsed) ? maxAgeParsed : -1,
        exposeHeaders: splitCsv(exposeHeadersText),
      }),
    [
      originMode,
      originsText,
      credentials,
      methods,
      allowedHeadersText,
      exposeHeadersText,
      maxAgeParsed,
    ],
  );

  const allHeaders = [
    ...Object.entries(result.responseHeaders),
    ...Object.entries(result.preflightHeaders),
  ];

  const handleCopySnippet = () => {
    if (!result.nginxSnippet) {
      message.error("存在配置错误，暂无可复制的片段");
      return;
    }
    copyToClipboard(result.nginxSnippet);
    message.success("已复制 nginx 片段");
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="策略配置">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <div style={{ marginBottom: 6 }}>
                允许来源（Access-Control-Allow-Origin）
              </div>
              <Radio.Group
                value={originMode}
                onChange={(e) => setOriginMode(e.target.value as OriginMode)}
              >
                <Space direction="vertical">
                  {ORIGIN_MODE_OPTIONS.map((option) => (
                    <Radio key={option.value} value={option.value}>
                      {option.label}
                      <span
                        style={{
                          color: "var(--color-text-secondary)",
                          fontSize: 12,
                        }}
                      >
                        {" "}
                        — {option.hint}
                      </span>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            {originMode === "list" ? (
              <div>
                <div style={{ marginBottom: 6 }}>Origin 白名单（每行一个）</div>
                <Input.TextArea
                  value={originsText}
                  onChange={(e) => setOriginsText(e.target.value)}
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  className={styles.editor}
                  spellCheck={false}
                />
              </div>
            ) : null}

            <Checkbox
              checked={credentials}
              onChange={(e) => setCredentials(e.target.checked)}
            >
              允许凭证 Access-Control-Allow-Credentials（Cookie / HTTP 认证）
            </Checkbox>

            <div>
              <div style={{ marginBottom: 6 }}>允许方法（预检）</div>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                value={methods}
                onChange={setMethods}
                options={COMMON_METHODS.map((method) => ({
                  label: method,
                  value: method,
                }))}
              />
            </div>

            <div>
              <div style={{ marginBottom: 6 }}>
                允许请求头 Allow-Headers（逗号分隔）
              </div>
              <Input
                value={allowedHeadersText}
                onChange={(e) => setAllowedHeadersText(e.target.value)}
                className={styles.editor}
                spellCheck={false}
              />
            </div>

            <div>
              <div style={{ marginBottom: 6 }}>
                暴露头 Expose-Headers（逗号分隔，可留空）
              </div>
              <Input
                value={exposeHeadersText}
                onChange={(e) => setExposeHeadersText(e.target.value)}
                className={styles.editor}
                spellCheck={false}
              />
            </div>

            <div>
              <div style={{ marginBottom: 6 }}>
                预检缓存 Max-Age（秒，留空不输出）
              </div>
              <Input
                value={maxAgeText}
                onChange={(e) => setMaxAgeText(e.target.value)}
                className={styles.editor}
                spellCheck={false}
              />
            </div>
          </Space>
        </Card>

        <Card
          className={styles.card}
          title="生成结果"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopySnippet}
            >
              复制 nginx
            </Button>
          }
        >
          {result.errors.length > 0 || result.warnings.length > 0 ? (
            <div className={styles.alerts} style={{ marginBottom: 12 }}>
              {result.errors.map((error) => (
                <Alert key={error} type="error" showIcon message={error} />
              ))}
              {result.warnings.map((warning) => (
                <Alert
                  key={warning}
                  type="warning"
                  showIcon
                  message={warning}
                />
              ))}
            </div>
          ) : null}

          {allHeaders.length > 0 ? (
            <>
              <Table
                className={styles.headerTable}
                size="small"
                pagination={false}
                rowKey="name"
                dataSource={allHeaders.map(([name, value]) => ({
                  name,
                  value,
                }))}
                columns={[
                  {
                    title: "响应头",
                    dataIndex: "name",
                    key: "name",
                    width: "46%",
                  },
                  { title: "值", dataIndex: "value", key: "value" },
                ]}
              />
              <div style={{ margin: "12px 0 6px" }}>
                <Tag color="blue">实际响应头</Tag>
                <Tag color="geekblue">预检 OPTIONS 追加头</Tag>
              </div>
              <pre className={styles.snippet}>{result.nginxSnippet}</pre>
            </>
          ) : (
            <Alert type="info" showIcon message="请先修正左侧配置错误" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default CorsHeaderGenerator;
