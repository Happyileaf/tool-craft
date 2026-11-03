"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Switch,
  message,
} from "antd";
import { ClearOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { jsonToZodSchema } from "./utils/zodInfer";
import {
  DEFAULT_INDENT,
  DEFAULT_ROOT_NAME,
  DEFAULT_SAMPLE,
  INDENT_OPTIONS,
  MULTI_SAMPLE,
} from "./constants";
import styles from "./index.module.css";
import { copyToClipboard } from "@/lib/utils";

/**
 * JSON → Zod v3 schema 生成器：从一个或多个（空行分隔的）JSON 样例推断
 * z.object / z.array / z.enum / 联合 / 可选 / 可空 schema 源码，
 * 仅产出代码文本，全部运算在浏览器本地完成，不引入 zod 运行时依赖
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 JSON 输入
 * @returns JSON → Zod 交互界面
 */
const JsonToZod: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(
    defaultInput || DEFAULT_SAMPLE,
  );
  const [rootName, setRootName] = React.useState<string>(DEFAULT_ROOT_NAME);
  const [indent, setIndent] = React.useState<number>(DEFAULT_INDENT);
  const [exportRoot, setExportRoot] = React.useState<boolean>(true);

  const { output, error } = React.useMemo(() => {
    try {
      const code = jsonToZodSchema(input, { rootName, indent, exportRoot });
      return { output: code, error: null as string | null };
    } catch (caught) {
      return {
        output: "",
        error:
          caught instanceof Error ? caught.message : "生成 Zod schema 失败",
      };
    }
  }, [input, rootName, indent, exportRoot]);

  /** 复制生成的 schema 源码 */
  const handleCopy = async () => {
    if (error || !output) {
      message.error("存在解析错误，无法复制");
      return;
    }
    await copyToClipboard(output);
    message.success("复制成功");
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="仅生成 Zod v3 schema 源码文本，不会安装或引入 zod 运行时依赖"
        description="粘贴单个 JSON 样例，或用空行分隔多个样例以推断可选字段、可空字段、枚举与联合类型。"
      />

      <div className={styles.toolbar}>
        <Space wrap className={styles.options}>
          <Space size={4}>
            <span>根 schema 名</span>
            <Input
              value={rootName}
              onChange={(event) => setRootName(event.target.value)}
              placeholder={DEFAULT_ROOT_NAME}
              style={{ width: 140 }}
            />
          </Space>
          <Space size={4}>
            <span>缩进</span>
            <Select
              value={indent}
              onChange={setIndent}
              options={INDENT_OPTIONS.map((value) => ({
                label: `${value} 空格`,
                value,
              }))}
              style={{ width: 110 }}
            />
          </Space>
          <Space size={4}>
            <span>导出根 schema</span>
            <Switch checked={exportRoot} onChange={setExportRoot} />
          </Space>
        </Space>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setInput(DEFAULT_SAMPLE)}
          >
            单样例
          </Button>
          <Button onClick={() => setInput(MULTI_SAMPLE)}>多样例</Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput("")}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="输入 JSON（多样例请用空行分隔）" className={styles.card}>
          <Input.TextArea
            className={styles.input}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              '在这里输入 JSON 文本...\n\n多样例：\n{"a": 1}\n\n{"a": 2, "b": "x"}'
            }
            autoSize={{ minRows: 14, maxRows: 28 }}
          />
        </Card>

        <Card
          title="生成的 Zod v3 Schema"
          className={styles.card}
          extra={
            !error && output ? (
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            ) : null
          }
        >
          {error ? (
            <Alert
              type="error"
              showIcon
              message="Schema 生成失败"
              description={error}
            />
          ) : (
            <Input.TextArea
              className={styles.code}
              value={output}
              readOnly
              placeholder="Zod schema 将显示在这里"
              autoSize={{ minRows: 14, maxRows: 28 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default JsonToZod;
