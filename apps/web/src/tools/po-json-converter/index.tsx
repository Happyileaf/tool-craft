"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import { Alert, Button, Card, Input, Radio, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { jsonToPo, poToJson } from "./utils/po";
import {
  DIRECTION_OPTIONS,
  SAMPLE_JSON,
  SAMPLE_PO,
  type ConvertDirection,
} from "./constants";
import { copyToClipboard } from "@/lib/utils";
import styles from "./index.module.css";

const PoJsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<ConvertDirection>("po2json");
  const [input, setInput] = React.useState(defaultInput || SAMPLE_PO);

  const result = React.useMemo(
    () => (direction === "po2json" ? poToJson(input) : jsonToPo(input)),
    [direction, input],
  );

  const handleDirectionChange = (next: ConvertDirection) => {
    setDirection(next);
    setInput(next === "po2json" ? SAMPLE_PO : SAMPLE_JSON);
  };

  const handleCopy = () => {
    if (result.error || result.output === "") {
      message.error("暂无可复制的结果，请先修正输入");
      return;
    }
    copyToClipboard(result.output);
    message.success("已复制转换结果");
  };

  const inputTitle = direction === "po2json" ? "PO / POT 输入" : "JSON 输入";
  const outputTitle = direction === "po2json" ? "JSON 输出" : "PO 输出";

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={direction}
          options={DIRECTION_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onChange={(e) =>
            handleDirectionChange(e.target.value as ConvertDirection)
          }
        />
        <Button
          onClick={() =>
            setInput(direction === "po2json" ? SAMPLE_PO : SAMPLE_JSON)
          }
        >
          载入样例
        </Button>
        <Button onClick={() => setInput("")}>清空</Button>
        <span className={styles.hint}>
          纯浏览器本地解析，支持 msgctxt、复数形式、跨行续行与 C 风格转义
        </span>
      </div>

      <div className={styles.panels}>
        <Card className={styles.card} title={inputTitle}>
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 14, maxRows: 24 }}
            placeholder={
              direction === "po2json"
                ? "在此粘贴 gettext .po / .pot 文本…"
                : '在此粘贴 JSON 对象，如 { "Hello": "你好" }…'
            }
          />
        </Card>

        <Card
          className={styles.card}
          title={outputTitle}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {result.error ? (
            <Alert type="error" showIcon message={result.error} />
          ) : (
            <Input.TextArea
              value={result.output}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 14, maxRows: 24 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default PoJsonConverter;
