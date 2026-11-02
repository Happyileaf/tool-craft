'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateRust } from './utils/rust-gen';
import { DEFAULT_ROOT_NAME, SAMPLE_JSON } from './constants';
import styles from './index.module.css';

const JsonToRust: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jsonText, setJsonText] = React.useState(defaultInput || SAMPLE_JSON);
  const [rootName, setRootName] = React.useState(DEFAULT_ROOT_NAME);
  const [optionWrap, setOptionWrap] = React.useState(true);
  const [debouncedText, setDebouncedText] = React.useState(jsonText);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(jsonText), 250);
    return () => clearTimeout(timer);
  }, [jsonText]);

  const result = React.useMemo(
    () => generateRust(debouncedText, { rootName, optionWrap }),
    [debouncedText, rootName, optionWrap],
  );

  const isParseError = result.code === '' && /JSON 解析失败/.test(result.warnings[0] ?? '');

  const handleCopy = () => {
    if (!result.code) {
      message.error('暂无可复制的 Rust 代码');
      return;
    }
    copyToClipboard(result.code);
    message.success('Rust 代码已复制');
  };

  return (
    <div className={styles.container}>
      <Card
        title="生成选项"
        size="small"
        extra={
          <Button size="small" onClick={() => setJsonText(SAMPLE_JSON)}>
            载入示例
          </Button>
        }
      >
        <div className={styles.options}>
          <label className={styles.optionItem}>
            <span>根结构体名</span>
            <Input
              value={rootName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRootName(e.target.value)}
              style={{ width: 180 }}
              placeholder={DEFAULT_ROOT_NAME}
            />
          </label>
          <label className={styles.optionItem}>
            <span>为可空字段包裹 Option</span>
            <Switch checked={optionWrap} onChange={setOptionWrap} />
          </label>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制 Rust 代码
          </Button>
        </div>
      </Card>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="JSON 样本"
          extra={
            <Button size="small" onClick={() => setJsonText('')}>
              清空
            </Button>
          }
        >
          <Input.TextArea
            value={jsonText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonText(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 18, maxRows: 30 }}
          />
        </Card>

        <Card
          className={styles.card}
          title={
            <span>
              Rust 结构体 <Tag color="geekblue">serde</Tag>
            </span>
          }
        >
          <pre className={styles.codeBlock}>{result.code || '// 等待有效的 JSON 输入…'}</pre>
        </Card>
      </div>

      {isParseError ? (
        <Alert type="error" showIcon message={result.warnings[0]} />
      ) : result.warnings.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={`${result.warnings.length} 条提示`}
          description={
            <ul className={styles.warningList}>
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Alert
        type="info"
        showIcon
        message="类型规则"
        description={
          <span>
            整数 → i64、浮点 → f64、布尔 → bool、字符串 → String、null →
            Option&lt;serde_json::Value&gt;；同型对象数组合并字段生成
            Vec&lt;ItemStruct&gt;，空数组或异型数组回退
            Vec&lt;serde_json::Value&gt;；字段名 snake_case 化并在必要时添加{' '}
            <code>#[serde(rename = "原键")]</code>。全部推断在浏览器本地完成。
          </span>
        }
      />
    </div>
  );
};

export default JsonToRust;
