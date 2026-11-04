'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generatePhpArray } from './utils/php-array-gen';
import { SAMPLE_JSON } from './constants';
import styles from './index.module.css';

const JsonToPhp: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jsonText, setJsonText] = React.useState(defaultInput || SAMPLE_JSON);
  const [shortSyntax, setShortSyntax] = React.useState(true);
  const [indent, setIndent] = React.useState<'spaces' | 'tab'>('spaces');
  const [trailingSemicolon, setTrailingSemicolon] = React.useState(true);
  const [debouncedText, setDebouncedText] = React.useState(jsonText);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(jsonText), 250);
    return () => clearTimeout(timer);
  }, [jsonText]);

  const result = React.useMemo(
    () => generatePhpArray(debouncedText, { shortSyntax, indent, trailingSemicolon }),
    [debouncedText, shortSyntax, indent, trailingSemicolon],
  );

  const isParseError = result.code === '' && /JSON 解析失败/.test(result.warnings[0] ?? '');

  const handleCopy = () => {
    if (!result.code) {
      message.error('暂无可复制的 PHP 代码');
      return;
    }
    copyToClipboard(result.code);
    message.success('PHP 代码已复制');
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
            <span>数组语法</span>
            <Radio.Group
              value={shortSyntax ? 'short' : 'long'}
              onChange={(e) => setShortSyntax(e.target.value === 'short')}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '短数组 []', value: 'short' },
                { label: 'array()', value: 'long' },
              ]}
            />
          </label>
          <label className={styles.optionItem}>
            <span>缩进</span>
            <Radio.Group
              value={indent}
              onChange={(e) => setIndent(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '4 空格', value: 'spaces' },
                { label: 'Tab', value: 'tab' },
              ]}
            />
          </label>
          <label className={styles.optionItem}>
            <span>结尾分号</span>
            <Switch checked={trailingSemicolon} onChange={setTrailingSemicolon} />
          </label>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制 PHP 代码
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
              PHP 数组字面量 <Tag color="purple">本地生成</Tag>
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
            JSON 对象生成关联数组（&apos;key&apos; =&gt;）、数组生成索引数组；字符串按 PHP
            单引号规则转义（仅转义反斜杠与单引号）；整数保持 int、浮点保持 float
            字面量、布尔为 true/false、null 为 null；空数组/空对象均输出 []，任意嵌套深度递归缩进。全部转换在浏览器本地完成。
          </span>
        }
      />
    </div>
  );
};

export default JsonToPhp;
