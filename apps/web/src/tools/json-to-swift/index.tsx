'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateSwift } from './utils/swift-gen';
import { DEFAULT_ROOT_NAME, SAMPLE_JSON } from './constants';
import styles from './index.module.css';

const JsonToSwift: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jsonText, setJsonText] = React.useState(defaultInput || SAMPLE_JSON);
  const [rootName, setRootName] = React.useState(DEFAULT_ROOT_NAME);
  const [propertyNaming, setPropertyNaming] = React.useState<'preserve' | 'camelCase'>(
    'camelCase',
  );
  const [optionalTypes, setOptionalTypes] = React.useState(true);
  const [codingKeys, setCodingKeys] = React.useState(true);
  const [debouncedText, setDebouncedText] = React.useState(jsonText);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(jsonText), 250);
    return () => clearTimeout(timer);
  }, [jsonText]);

  const result = React.useMemo(
    () => generateSwift(debouncedText, { rootName, propertyNaming, optionalTypes, codingKeys }),
    [debouncedText, rootName, propertyNaming, optionalTypes, codingKeys],
  );

  const isParseError = result.code === '' && /JSON 解析失败/.test(result.warnings[0] ?? '');

  const handleCopy = () => {
    if (!result.code) {
      message.error('暂无可复制的 Swift 代码');
      return;
    }
    copyToClipboard(result.code);
    message.success('Swift 代码已复制');
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
              placeholder="Root"
              style={{ width: 160 }}
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
            <span>可选类型</span>
            <Switch checked={optionalTypes} onChange={setOptionalTypes} />
          </label>
          <label className={styles.optionItem}>
            <span>CodingKeys</span>
            <Switch checked={codingKeys} onChange={setCodingKeys} />
          </label>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制 Swift 代码
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
              Swift 模型 <Tag color="orange">Codable</Tag>
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
        message="转换规则"
        description={
          <span>
            整数 → Int、浮点 → Double、布尔 → Bool、字符串 → String；数组 → [元素类型]，同型对象数组合并字段、空数组回退 [Any]；出现 null 或数组元素缺字段时属性输出可选类型
            T?；键名含非法字符或与 Swift 关键字冲突时自动改写属性名并生成 CodingKeys，重名嵌套结构体自动编号。全部转换在浏览器本地完成。
          </span>
        }
      />
    </div>
  );
};

export default JsonToSwift;
