"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  Col,
  InputNumber,
  Radio,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import {
  DEFAULT_INPUT,
  MAX_PX_VALUE,
  VIEWPORT_UNIT_OPTIONS,
  type ClampInput,
} from "./constants";
import {
  clampedFontSizeAtViewport,
  generateClamp,
  validateClampInput,
} from "./utils/clamp";

const { Text, Paragraph } = Typography;

/** 预览曲线的采样视口宽度（px） */
const PREVIEW_VIEWPORTS = [320, 375, 480, 768, 1024, 1280, 1440, 1920];

/**
 * CSS clamp() 流式排版生成器：给定最小/最大字号与对应视口宽度，
 * 推导线性公式并生成 clamp() 表达式，附实时字号预览，全程本地计算
 *
 * @param _props - 工具组件属性（本工具无默认样例输入）
 * @returns 流式排版生成交互界面
 */
const ClampTypographyGenerator: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState<ClampInput>(DEFAULT_INPUT);

  const updateField = React.useCallback(
    <K extends keyof ClampInput>(key: K, value: ClampInput[K]) => {
      setInput((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const validationError = validateClampInput(input);

  const result = React.useMemo(() => {
    if (validationError) {
      return null;
    }
    return generateClamp(input);
  }, [input, validationError]);

  const previewRows = React.useMemo(
    () =>
      PREVIEW_VIEWPORTS.map((viewport) => ({
        key: viewport,
        viewport,
        fontSize: validationError
          ? null
          : clampedFontSizeAtViewport(input, viewport),
        phase:
          viewport <= input.minViewport
            ? "最小字号钳制"
            : viewport >= input.maxViewport
              ? "最大字号钳制"
              : "线性缩放区间",
      })),
    [input, validationError],
  );

  const handleCopy = React.useCallback(
    (text: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => message.success("已复制到剪贴板"))
        .catch(() => message.error("复制失败，请手动选择文本复制"));
    },
    [],
  );

  return (
    <div className="space-y-4">
      <Card title="CSS clamp() 流式排版生成器">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>最小字号（px）</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 8 }}
              min={1}
              max={MAX_PX_VALUE}
              precision={2}
              value={input.minFontSize}
              onChange={(value) =>
                updateField("minFontSize", value ?? DEFAULT_INPUT.minFontSize)
              }
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>最大字号（px）</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 8 }}
              min={1}
              max={MAX_PX_VALUE}
              precision={2}
              value={input.maxFontSize}
              onChange={(value) =>
                updateField("maxFontSize", value ?? DEFAULT_INPUT.maxFontSize)
              }
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>最小视口宽度（px）</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 8 }}
              min={1}
              max={MAX_PX_VALUE}
              precision={0}
              value={input.minViewport}
              onChange={(value) =>
                updateField("minViewport", value ?? DEFAULT_INPUT.minViewport)
              }
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>最大视口宽度（px）</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 8 }}
              min={1}
              max={MAX_PX_VALUE}
              precision={0}
              value={input.maxViewport}
              onChange={(value) =>
                updateField("maxViewport", value ?? DEFAULT_INPUT.maxViewport)
              }
            />
          </Col>
          <Col xs={24}>
            <Text strong>视口单位</Text>
            <div style={{ marginTop: 8 }}>
              <Radio.Group
                value={input.viewportUnit}
                onChange={(event) =>
                  updateField("viewportUnit", event.target.value)
                }
                optionType="button"
                buttonStyle="solid"
                options={VIEWPORT_UNIT_OPTIONS.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
              />
            </div>
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {VIEWPORT_UNIT_OPTIONS.find(
                (item) => item.value === input.viewportUnit,
              )?.hint}
            </Paragraph>
          </Col>
        </Row>

        {validationError && (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message={validationError}
          />
        )}
      </Card>

      {result && (
        <>
          <Card title="生成结果">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Text strong>线性公式参数</Text>
                <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
                  <Col xs={12} sm={6}>
                    <Text type="secondary">斜率（px/px）</Text>
                    <div>{result.slope}</div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Text type="secondary">
                      {input.viewportUnit} 系数
                    </Text>
                    <div>{result.slopeInViewportUnit}</div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Text type="secondary">截距（px）</Text>
                    <div>{result.intercept}</div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Text type="secondary">rem 基准（px）</Text>
                    <div>{result.rootFontSize}</div>
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong>clamp() 表达式</Text>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "rgb(249 250 251)",
                    border: "1px solid rgb(229 231 235)",
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <code
                    style={{
                      fontSize: 13,
                      wordBreak: "break-all",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                  >
                    {result.clampExpression}
                  </code>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(result.clampExpression)}
                  >
                    复制
                  </Button>
                </div>
              </div>

              <div>
                <Text strong>CSS 声明（可直接粘贴）</Text>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "rgb(17 24 39)",
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <code
                    style={{
                      color: "rgb(229 231 235)",
                      fontSize: 13,
                      wordBreak: "break-all",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                  >
                    {result.cssDeclaration}
                  </code>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(result.cssDeclaration)}
                  >
                    复制
                  </Button>
                </div>
              </div>
            </Space>
          </Card>

          <Card title="字号实时预览">
            <div
              style={{
                fontSize: result.clampExpression,
                lineHeight: 1.4,
                padding: "8px 0",
                wordBreak: "break-word",
              }}
            >
              这是一行使用生成的 clamp() 表达式渲染的示例文字 The quick brown
              fox jumps over the lazy dog 0123456789。
            </div>
            <Table
              style={{ marginTop: 16 }}
              size="small"
              pagination={false}
              dataSource={previewRows}
              columns={[
                {
                  title: "视口宽度（px）",
                  dataIndex: "viewport",
                  width: "30%",
                },
                {
                  title: "实际字号（px）",
                  dataIndex: "fontSize",
                  width: "30%",
                  render: (value: number | null) =>
                    value === null ? "—" : <Text strong>{value}</Text>,
                },
                {
                  title: "所处阶段",
                  dataIndex: "phase",
                  render: (value: string) => (
                    <Tag
                      color={
                        value === "线性缩放区间"
                          ? "blue"
                          : value === "最小字号钳制"
                            ? "default"
                            : "green"
                      }
                    >
                      {value}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ClampTypographyGenerator;
