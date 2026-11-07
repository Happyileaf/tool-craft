"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import { Alert, Button, Card, Input, Radio, Tag, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { processLines, type LuhnMode } from "./utils/luhn";
import { DEFAULT_INPUT, MODE_OPTIONS } from "./constants";
import { copyToClipboard } from "@/lib/utils";
import styles from "./index.module.css";

const LuhnCheckGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<LuhnMode>("generate");
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => processLines(input, mode), [input, mode]);

  const handleCopy = () => {
    if (result.output === "") {
      message.error("暂无可复制的结果");
      return;
    }
    copyToClipboard(result.output);
    message.success("已复制处理结果");
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="输入"
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={mode}
              options={MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setMode(e.target.value as LuhnMode)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="每行一个数字编号（空格与连字符会被忽略）…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {mode === "validate" && result.total > 0 ? (
            <div className={styles.stats}>
              <Tag color="blue">共 {result.total} 条</Tag>
              <Tag color="green">合法 {result.validCount}</Tag>
              <Tag color={result.invalidCount > 0 ? "red" : "default"}>
                非法 {result.invalidCount}
              </Tag>
            </div>
          ) : null}
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <span className={styles.hint}>{activeMode?.hint}</span>
      </div>
    </div>
  );
};

export default LuhnCheckGenerator;
