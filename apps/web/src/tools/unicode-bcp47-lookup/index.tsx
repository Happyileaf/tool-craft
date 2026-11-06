'use client';

import React, { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Tag, Tooltip, Typography } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { parseBcp47Tag, type BcpParseResult } from './utils/bcp47';
import {
  DATA_SOURCE_HINT,
  EXAMPLE_TAGS,
  FIELD_LABELS,
  INPUT_PLACEHOLDER,
  SYNTAX_SECTIONS,
  TOOL_TITLE,
} from './constants';
import styles from './index.module.css';

const { Text, Paragraph } = Typography;

/**
 * 渲染单行结构化字段（标签 + 值），值为空时不渲染。
 *
 * @param label - 字段中文名
 * @param children - 字段内容
 * @returns 详情行或 null
 */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement | null {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailText}>{children}</span>
    </div>
  );
}

/**
 * 渲染错误 / 警告诊断列表。
 *
 * @param result - 解析结果
 * @returns 诊断区域
 */
function Diagnostics({ result }: { result: BcpParseResult }): React.ReactElement {
  if (result.diagnostics.length === 0) {
    return (
      <Alert
        type="success"
        showIcon
        message="未发现错误或警告：标签完全符合 BCP 47 语法，且所有子标签均命中内置常用登记表。"
      />
    );
  }
  return (
    <div className={styles.diagnosticList}>
      {result.diagnostics.map((item, index) => (
        <Alert
          key={`diagnostic-${index}`}
          type={item.level === 'error' ? 'error' : 'warning'}
          showIcon
          message={item.level === 'error' ? '语法错误' : '可疑点 / 警告'}
          description={item.message}
        />
      ))}
    </div>
  );
}

/**
 * BCP 47 语言标签解析工具：输入标签后展示分段结构、规范化写法、
 * u 扩展 keyword 与逐条诊断，全部计算在浏览器本地完成。
 */
const UnicodeBcp47Lookup: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = useState('zh-Hans-CN');

  const result = useMemo(() => parseBcp47Tag(input), [input]);

  return (
    <div className={styles.container}>
      <Card title={TOOL_TITLE}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input
            className={styles.tagInput}
            size="large"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={INPUT_PLACEHOLDER}
            allowClear
            spellCheck={false}
            prefix={
              result.valid ? (
                <Tooltip title="语法合法">
                  <CheckCircleTwoTone twoToneColor="#52c41a" />
                </Tooltip>
              ) : (
                <Tooltip title="存在语法错误">
                  <CloseCircleTwoTone twoToneColor="#ff4d4f" />
                </Tooltip>
              )
            }
          />
          <div className={styles.examples}>
            {EXAMPLE_TAGS.map((example) => (
              <Button
                key={example.value}
                size="small"
                onClick={() => setInput(example.value)}
              >
                {example.label}
              </Button>
            ))}
          </div>
          <p className={styles.hint}>{DATA_SOURCE_HINT}</p>
        </Space>
      </Card>

      {input.trim() === '' ? (
        <Card>
          <Empty description="输入标签后展示解析结果" />
        </Card>
      ) : (
        <Card
          title={
            <Space>
              <span>解析结果</span>
              {result.valid ? <Tag color="success">合法</Tag> : <Tag color="error">非法</Tag>}
            </Space>
          }
        >
          <div className={styles.resultBlock}>
            <Diagnostics result={result} />

            {result.canonical && (
              <DetailRow label={FIELD_LABELS.canonical}>
                <Text strong code copyable={{ text: result.canonical }}>
                  {result.canonical}
                </Text>
              </DetailRow>
            )}
            {result.grandfathered && (
              <DetailRow label={FIELD_LABELS.grandfathered}>
                <Text code>{result.grandfathered}</Text>
              </DetailRow>
            )}
            {result.language && (
              <DetailRow label={FIELD_LABELS.language}>
                <Text code>{result.language}</Text>
              </DetailRow>
            )}
            {result.extlangs.length > 0 && (
              <DetailRow label={FIELD_LABELS.extlangs}>
                {result.extlangs.map((item) => (
                  <Tag key={item} color="blue" className={styles.mono}>
                    {item}
                  </Tag>
                ))}
              </DetailRow>
            )}
            {result.script && (
              <DetailRow label={FIELD_LABELS.script}>
                <Text code>{result.script}</Text>
              </DetailRow>
            )}
            {result.region && (
              <DetailRow label={FIELD_LABELS.region}>
                <Text code>{result.region}</Text>
              </DetailRow>
            )}
            {result.variants.length > 0 && (
              <DetailRow label={FIELD_LABELS.variants}>
                {result.variants.map((item) => (
                  <Tag key={item} color="purple" className={styles.mono}>
                    {item}
                  </Tag>
                ))}
              </DetailRow>
            )}
            {result.extensions.length > 0 && (
              <DetailRow label={FIELD_LABELS.extensions}>
                <Space direction="vertical" size={4}>
                  {result.extensions.map((ext) => (
                    <Text key={ext.singleton} code className={styles.mono}>
                      {ext.singleton}-{ext.tokens.join('-')}
                    </Text>
                  ))}
                </Space>
              </DetailRow>
            )}
            {result.unicodeExtension && (
              <DetailRow label={FIELD_LABELS.unicode}>
                <Space direction="vertical" size={4}>
                  {result.unicodeExtension.attributes.length > 0 && (
                    <span>
                      <Text type="secondary">attributes：</Text>
                      {result.unicodeExtension.attributes.map((item) => (
                        <Tag key={item}>{item}</Tag>
                      ))}
                    </span>
                  )}
                  {result.unicodeExtension.keywords.map((keyword) => (
                    <span key={keyword.key} className={styles.mono}>
                      <Tag color="geekblue">{keyword.key}</Tag>
                      <Text type="secondary">→</Text>{' '}
                      {keyword.values.length > 0 ? keyword.values.join(', ') : <Text type="secondary">（无值）</Text>}
                    </span>
                  ))}
                </Space>
              </DetailRow>
            )}
            {result.privateUse.length > 0 && (
              <DetailRow label={FIELD_LABELS.privateUse}>
                <Text code className={styles.mono}>
                  x-{result.privateUse.join('-')}
                </Text>
              </DetailRow>
            )}
          </div>
        </Card>
      )}

      <Card title="BCP 47 语法速查（RFC 5646）">
        <Paragraph className={styles.hint} style={{ marginTop: 0 }}>
          整体顺序：language [- extlang] [- script] [- region] *(- variant) *(- extension) [- privateuse]
        </Paragraph>
        <div className={styles.syntaxGrid}>
          {SYNTAX_SECTIONS.map((section) => (
            <div key={section.term} className={styles.syntaxCard}>
              <span className={styles.syntaxTerm}>{section.term}</span>
              <span className={styles.syntaxRule}>{section.rule}</span>
              <span className={styles.syntaxExample}>示例：{section.example}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default UnicodeBcp47Lookup;
