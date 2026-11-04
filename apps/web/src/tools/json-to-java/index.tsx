'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateJava } from './utils/java-gen';
import { DEFAULT_PACKAGE_NAME, DEFAULT_ROOT_NAME, SAMPLE_JSON } from './constants';
import styles from './index.module.css';

const JsonToJava: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jsonText, setJsonText] = React.useState(defaultInput || SAMPLE_JSON);
  const [rootName, setRootName] = React.useState(DEFAULT_ROOT_NAME);
  const [packageName, setPackageName] = React.useState(DEFAULT_PACKAGE_NAME);
  const [style, setStyle] = React.useState<'record' | 'class'>('record');
  const [useList, setUseList] = React.useState(true);
  const [useBigNumbers, setUseBigNumbers] = React.useState(false);
  const [debouncedText, setDebouncedText] = React.useState(jsonText);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(jsonText), 250);
    return () => clearTimeout(timer);
  }, [jsonText]);

  const result = React.useMemo(
    () => generateJava(debouncedText, { rootName, packageName, style, useList, useBigNumbers }),
    [debouncedText, rootName, packageName, style, useList, useBigNumbers],
  );

  const isParseError = result.code === '' && /JSON 解析失败/.test(result.warnings[0] ?? '');

  const handleCopy = () => {
    if (!result.code) {
      message.error('暂无可复制的 Java 代码');
      return;
    }
    copyToClipboard(result.code);
    message.success('Java 代码已复制');
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
            <span>包名</span>
            <Input
              value={packageName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPackageName(e.target.value)}
              style={{ width: 200 }}
              placeholder="com.example.dto（留空则不输出 package）"
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
                { label: 'class (POJO)', value: 'class' },
              ]}
            />
          </label>
          <label className={styles.optionItem}>
            <span>集合用 List&lt;T&gt;</span>
            <Switch checked={useList} onChange={setUseList} />
          </label>
          <label className={styles.optionItem}>
            <span>大数用 BigInteger / BigDecimal</span>
            <Switch checked={useBigNumbers} onChange={setUseBigNumbers} />
          </label>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制 Java 代码
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
              Java {style === 'record' ? 'record' : 'class'} <Tag color="geekblue">本地生成</Tag>
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
            小整数 → int、大整数 → long（可选 BigInteger）、浮点 → double（可选 BigDecimal）、布尔 →
            boolean、字符串 → String、null/异型值 → Object；数组合并同型元素生成
            List&lt;T&gt; 或 T[]，空数组元素回退 Object；字段名小驼峰化并规避关键字，出现过
            null 的原始类型字段自动改用包装类型。嵌套对象生成为静态内部类/内部 record。全部推断在浏览器本地完成。
          </span>
        }
      />
    </div>
  );
};

export default JsonToJava;
