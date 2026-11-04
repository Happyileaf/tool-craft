'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateKotlin } from './utils/kotlin-gen';
import { DEFAULT_PACKAGE_NAME, DEFAULT_ROOT_NAME, SAMPLE_JSON } from './constants';
import styles from './index.module.css';

const JsonToKotlin: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jsonText, setJsonText] = React.useState(defaultInput || SAMPLE_JSON);
  const [rootName, setRootName] = React.useState(DEFAULT_ROOT_NAME);
  const [packageName, setPackageName] = React.useState(DEFAULT_PACKAGE_NAME);
  const [propertyNaming, setPropertyNaming] = React.useState<'preserve' | 'camelCase'>('preserve');
  const [nullableTypes, setNullableTypes] = React.useState(true);
  const [useList, setUseList] = React.useState(true);
  const [debouncedText, setDebouncedText] = React.useState(jsonText);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(jsonText), 250);
    return () => clearTimeout(timer);
  }, [jsonText]);

  const result = React.useMemo(
    () =>
      generateKotlin(debouncedText, {
        rootName,
        packageName,
        propertyNaming,
        nullableTypes,
        useList,
      }),
    [debouncedText, rootName, packageName, propertyNaming, nullableTypes, useList],
  );

  const isParseError = result.code === '' && /JSON 解析失败/.test(result.warnings[0] ?? '');

  const handleCopy = () => {
    if (!result.code) {
      message.error('暂无可复制的 Kotlin 代码');
      return;
    }
    copyToClipboard(result.code);
    message.success('Kotlin 代码已复制');
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
            <span>属性命名</span>
            <Radio.Group
              value={propertyNaming}
              onChange={(e) => setPropertyNaming(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '保留原键', value: 'preserve' },
                { label: 'camelCase', value: 'camelCase' },
              ]}
            />
          </label>
          <label className={styles.optionItem}>
            <span>可空类型 (T?)</span>
            <Switch checked={nullableTypes} onChange={setNullableTypes} />
          </label>
          <label className={styles.optionItem}>
            <span>集合用 List&lt;T&gt;</span>
            <Switch checked={useList} onChange={setUseList} />
          </label>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制 Kotlin 代码
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
              Kotlin data class <Tag color="orange">本地生成</Tag>
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
            小整数 → Int、大整数 → Long、浮点 → Double、布尔 → Boolean、字符串 → String、null/异型值 →
            Any；数组生成 List&lt;T&gt;（可切换 Array&lt;T&gt;），同型对象数组合并字段，空数组元素回退
            Any；类名 PascalCase、重名嵌套类自动编号，出现 null 或缺省的字段输出 T? =
            null。原键不是合法 Kotlin 标识符（如下划线、连字符、关键字）时属性转 camelCase
            并自动附加 @SerializedName 注解。全部推断在浏览器本地完成。
          </span>
        }
      />
    </div>
  );
};

export default JsonToKotlin;
