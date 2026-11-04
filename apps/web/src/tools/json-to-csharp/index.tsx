'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateCSharp } from './utils/csharp-gen';
import { DEFAULT_NAMESPACE, DEFAULT_ROOT_NAME, SAMPLE_JSON } from './constants';
import styles from './index.module.css';

const JsonToCSharp: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jsonText, setJsonText] = React.useState(defaultInput || SAMPLE_JSON);
  const [rootName, setRootName] = React.useState(DEFAULT_ROOT_NAME);
  const [namespace, setNamespace] = React.useState(DEFAULT_NAMESPACE);
  const [style, setStyle] = React.useState<'record' | 'class'>('record');
  const [nullableRefTypes, setNullableRefTypes] = React.useState(true);
  const [debouncedText, setDebouncedText] = React.useState(jsonText);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(jsonText), 250);
    return () => clearTimeout(timer);
  }, [jsonText]);

  const result = React.useMemo(
    () => generateCSharp(debouncedText, { rootName, namespace, style, nullableRefTypes }),
    [debouncedText, rootName, namespace, style, nullableRefTypes],
  );

  const isParseError = result.code === '' && /JSON 解析失败/.test(result.warnings[0] ?? '');

  const handleCopy = () => {
    if (!result.code) {
      message.error('暂无可复制的 C# 代码');
      return;
    }
    copyToClipboard(result.code);
    message.success('C# 代码已复制');
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
            <span>根类名</span>
            <Input
              value={rootName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRootName(e.target.value)}
              style={{ width: 160 }}
              placeholder={DEFAULT_ROOT_NAME}
            />
          </label>
          <label className={styles.optionItem}>
            <span>命名空间</span>
            <Input
              value={namespace}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNamespace(e.target.value)}
              style={{ width: 200 }}
              placeholder="Example.Dtos（留空则不输出 namespace）"
            />
          </label>
          <label className={styles.optionItem}>
            <span>风格</span>
            <Radio.Group
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: 'record', value: 'record' },
                { label: 'class', value: 'class' },
              ]}
            />
          </label>
          <label className={styles.optionItem}>
            <span>#nullable enable</span>
            <Switch checked={nullableRefTypes} onChange={setNullableRefTypes} />
          </label>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制 C# 代码
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
              C# {style} <Tag color="purple">本地生成</Tag>
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
            小整数 → int、大整数 → long、浮点 → double、布尔 → bool、字符串 → string、null/异型值 →
            object；数组生成 List&lt;T&gt;，同型对象数组合并字段，空数组元素回退 object；属性名
            PascalCase 化并转义关键字，出现 null 或仅在部分数组元素出现的字段标记可空（值类型
            int?/bool?，引用类型在 #nullable enable 下加 ?）。嵌套对象生成为 sealed record/class。全部推断在浏览器本地完成。
          </span>
        }
      />
    </div>
  );
};

export default JsonToCSharp;
