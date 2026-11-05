'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { processBatch, type SqlEscapeMode, type SqlEscapeResult } from './utils/sqlEscape';
import { DEFAULT_INPUTS, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const SqlLiteralEscape: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<SqlEscapeMode>('standard-escape');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUTS['standard-escape']);

  const results = React.useMemo<SqlEscapeResult[]>(
    () => (input.trim() === '' ? [] : processBatch(input, mode)),
    [input, mode],
  );

  const handleModeChange = (next: SqlEscapeMode) => {
    setMode(next);
    // 切换模式且用户未输入自定义内容时，载入对应示例
    setInput((current) =>
      current.trim() === '' || Object.values(DEFAULT_INPUTS).includes(current)
        ? DEFAULT_INPUTS[next]
        : current,
    );
  };

  const activeOption = MODE_OPTIONS.find((option) => option.value === mode);
  const validResults = results.filter((result) => result.valid);
  const outputText = validResults.map((result) => result.output).join('\n');
  const clauseText = validResults
    .map((result) => result.likeClause)
    .filter((clause) => clause !== '')
    .join('\n');

  const handleCopy = () => {
    if (!outputText) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(outputText);
    message.success(`已复制 ${validResults.length} 条转换结果`);
  };

  return (
    <div className={styles.container}>
      <Card size="small" title="转换模式">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => handleModeChange(e.target.value as SqlEscapeMode)}
          />
          <span className={styles.hint}>{activeOption?.hint}，支持每行一条批量处理</span>
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="本工具只处理 SQL 字符串字面量：标准 SQL 用双写单引号 '' 转义，MySQL 额外支持反斜杠序列；LIKE 模式仅转义通配符 %、_ 与转义符本身，并生成带 ESCAPE 子句的完整表达式。通用 JS/JSON/Python/Java 字面量请使用字符串字面量转义工具。"
      />

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={activeOption?.isEscape ? '原始文本（每行一条）' : 'SQL 字面量（每行一条）'}
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder={activeOption?.isEscape ? '粘贴需要转义的原始文本…' : "粘贴带外层单引号的 SQL 字面量…"}
          />
        </Card>

        <Card
          className={styles.card}
          title="转换结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {results.length === 0 ? (
            <Alert type="info" showIcon message="请输入需要转换的内容" />
          ) : (
            <div className={styles.resultList}>
              {results.map((result, index) =>
                result.valid ? (
                  <div className={styles.resultRow} key={index}>
                    {result.output}
                    {result.likeClause ? <div className={styles.clause}>{result.likeClause}</div> : null}
                  </div>
                ) : (
                  <div className={`${styles.resultRow} ${styles.resultRowError}`} key={index}>
                    第 {index + 1} 行无效：{result.error}
                  </div>
                ),
              )}
            </div>
          )}
          {results.length > 0 ? (
            <p className={styles.summary}>
              共 {results.length} 条，成功 {validResults.length} 条，失败 {results.length - validResults.length} 条
              {clauseText ? '；LIKE 表达式已随结果生成' : ''}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default SqlLiteralEscape;
