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
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { LICENSES, MAX_YEAR, MIN_YEAR } from "./constants";
import {
  generateLicense,
  getLicenseMeta,
  hasPlaceholders,
} from "./utils/generate";

const { Paragraph, Text } = Typography;

/**
 * 开源许可证生成器：选择内置 SPDX 许可证并填充年份/著作权人，
 * 生成可直接写入 LICENSE 文件的完整许可证文本，全程本地运算
 *
 * @param _props - 工具组件属性（本工具无默认样例输入）
 * @returns 许可证生成交互界面
 */
const LicenseGenerator: React.FC<ToolComponentProps> = () => {
  const [licenseId, setLicenseId] = React.useState<string>(
    LICENSES[0]?.id ?? "MIT",
  );
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [holder, setHolder] = React.useState<string>("");

  const meta = React.useMemo(() => getLicenseMeta(licenseId), [licenseId]);
  const needsHolder = hasPlaceholders(licenseId);

  const { output, error } = React.useMemo<{
    output: string;
    error: string;
  }>(() => {
    if (needsHolder && !holder.trim()) {
      return { output: "", error: "" };
    }
    try {
      return { output: generateLicense(licenseId, year, holder), error: "" };
    } catch (err) {
      return {
        output: "",
        error: err instanceof Error ? err.message : "生成失败",
      };
    }
  }, [licenseId, year, holder, needsHolder]);

  /**
   * 复制许可证全文到剪贴板
   */
  const handleCopy = React.useCallback(() => {
    if (!output) {
      return;
    }
    navigator.clipboard
      .writeText(output)
      .then(() => message.success("许可证全文已复制"))
      .catch(() => message.error("复制失败，请手动选择文本复制"));
  }, [output]);

  /**
   * 以 LICENSE 为文件名下载许可证全文
   */
  const handleDownload = React.useCallback(() => {
    if (!output) {
      return;
    }
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LICENSE";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    message.success("已下载 LICENSE 文件");
  }, [output]);

  return (
    <div className="space-y-4">
      <Card title="开源许可证生成器">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong>选择许可证</Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              value={licenseId}
              onChange={setLicenseId}
              options={LICENSES.map((item) => ({
                value: item.id,
                label: `${item.name}（${item.spdxName}）`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </div>

          {meta && (
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Copyleft 强度">
                <Tag
                  color={
                    meta.copyleft === "强"
                      ? "red"
                      : meta.copyleft === "弱"
                        ? "orange"
                        : "green"
                  }
                >
                  {meta.copyleft}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="专利授权">
                {meta.patentGrant ? "包含明确专利授权条款" : "无专门专利授权条款"}
              </Descriptions.Item>
              <Descriptions.Item label="简介">{meta.summary}</Descriptions.Item>
              <Descriptions.Item label="适用场景">
                {meta.useCase}
              </Descriptions.Item>
            </Descriptions>
          )}

          {needsHolder && (
            <Space wrap align="start">
              <div>
                <Text strong>著作权年份</Text>
                <div style={{ marginTop: 8 }}>
                  <InputNumber
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    precision={0}
                    value={year}
                    onChange={(value) => setYear(value ?? new Date().getFullYear())}
                    style={{ width: 140 }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <Text strong>著作权人</Text>
                <Input
                  style={{ marginTop: 8 }}
                  placeholder="个人姓名或组织名称，例如 Alice 或 Acme Corp"
                  value={holder}
                  maxLength={120}
                  onChange={(event) => setHolder(event.target.value)}
                />
              </div>
            </Space>
          )}

          {!needsHolder && (
            <Alert
              type="info"
              showIcon
              message="该许可证为公有领域弃权文本，不含年份与著作权人占位符，无需填写即可生成。"
            />
          )}

          {error && <Alert type="error" showIcon message={error} />}
        </Space>
      </Card>

      {output && (
        <Card
          title="许可证全文预览"
          extra={
            <Space>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                复制全文
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              >
                下载 LICENSE
              </Button>
            </Space>
          }
        >
          <Paragraph>
            <pre
              style={{
                margin: 0,
                maxHeight: 480,
                overflow: "auto",
                padding: 12,
                background: "rgb(249 250 251)",
                border: "1px solid rgb(229 231 235)",
                borderRadius: 6,
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {output}
            </pre>
          </Paragraph>
        </Card>
      )}
    </div>
  );
};

export default LicenseGenerator;
