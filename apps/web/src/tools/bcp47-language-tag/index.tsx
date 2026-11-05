'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Space,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  COMMON_LANGUAGES,
  COMMON_REGIONS,
  COMMON_SCRIPTS,
  crossValidateWithIntl,
  parseBcp47,
  type Bcp47ParseResult,
} from './utils/bcp47';
import { INPUT_PLACEHOLDER, SAMPLE_TAGS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 结构化字段展示行 */
function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

/** 子标签代码样式 */
function Code({ children }: { children: React.ReactNode }) {
  return <code className={styles.code}>{children}</code>;
}

/**
 * BCP 47 语言标签解析器：在浏览器本地按 RFC 5646 语法拆解语言标签，
 * 结构化展示语言、脚本、区域、变体、扩展（含 u 扩展 keyword）与私有子标签，
 * 并给出结构错误、告警、大小写规范化建议及 Intl.Locale 交叉验证。
 *
 * @returns BCP 47 解析交互界面
 */
const Bcp47LanguageTag: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [tag, setTag] = React.useState(defaultInput || 'zh-Hans-CN-u-ca-chinese-nu-hans');
  const result: Bcp47ParseResult = React.useMemo(() => parseBcp47(tag), [tag]);
  const hasError = result.diagnostics.some((item) => item.level === 'error');

  const intlCross = React.useMemo(() => {
    if (!result.canonical || hasError || result.grandfathered) {
      return null;
    }
    return crossValidateWithIntl(result.canonical);
  }, [result.canonical, hasError, result.grandfathered]);

  const handleCopyCanonical = () => {
    if (!result.canonical) {
      message.error('暂无可复制的规范化标签');
      return;
    }
    copyToClipboard(result.canonical);
    message.success('已复制规范化标签');
  };

  return (
    <div className={styles.container}>
      <Card title="BCP 47 语言标签解析器（RFC 5646）">
        <Input
          allowClear
          spellCheck={false}
          className={styles.input}
          placeholder={INPUT_PLACEHOLDER}
          value={tag}
          onChange={(event) => setTag(event.target.value)}
        />
        <Space size={[8, 8]} wrap className={styles.samples}>
          {SAMPLE_TAGS.map((sample) => (
            <Button
              key={sample.value}
              size="small"
              onClick={() => setTag(sample.value)}
            >
              {sample.label}
            </Button>
          ))}
        </Space>
        <p className={styles.hint}>
          全部解析在浏览器本地完成，无网络请求；error 表示结构非法，warning 表示可解析但存在风险或未收录子标签。
        </p>
      </Card>

      {!tag.trim() ? (
        <Card className={styles.card}>
          <Empty description="输入语言标签后查看结构化解析结果" />
        </Card>
      ) : (
        <>
          <Card
            className={styles.card}
            title="解析结果"
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyCanonical}>
                复制规范化标签
              </Button>
            }
          >
            {result.grandfathered ? (
              <Alert
                type="warning"
                showIcon
                className={styles.alert}
                message="Grandfathered（遗留）标签"
                description={
                  <span>
                    该标签为整体识别的遗留标签 <Code>{result.grandfathered}</Code>，不按常规
                    language-script-region 语法拆解。
                  </span>
                }
              />
            ) : null}

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="规范化标签">
                <Code>{result.canonical || '—'}</Code>
              </Descriptions.Item>
              <Descriptions.Item label="主语言 language">
                {result.language ? (
                  <Space size={8}>
                    <Code>{result.language}</Code>
                    <span className={styles.muted}>
                      {COMMON_LANGUAGES[result.language] ?? '未收录于常用语言表'}
                    </span>
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="extlang">
                {result.extlang ? <Code>{result.extlang}</Code> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="脚本 script">
                {result.script ? (
                  <Space size={8}>
                    <Code>{result.script}</Code>
                    <span className={styles.muted}>
                      {COMMON_SCRIPTS[result.script] ?? '未收录于常用脚本表'}
                    </span>
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="区域 region">
                {result.region ? (
                  <Space size={8}>
                    <Code>{result.region}</Code>
                    <span className={styles.muted}>
                      {COMMON_REGIONS[result.region] ?? '未收录于常用区域表'}
                    </span>
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="变体 variants">
                {result.variants.length > 0 ? (
                  <Space size={4} wrap>
                    {result.variants.map((variant) => (
                      <Tag key={variant}>{variant}</Tag>
                    ))}
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="扩展 extensions">
                {result.extensions.length > 0 ? (
                  <div className={styles.extList}>
                    {result.extensions.map((extension) => (
                      <div key={extension.singleton} className={styles.extBlock}>
                        <FieldRow
                          label={`${extension.singleton} 扩展`}
                          value={<Code>{extension.subtags.join(' ') || '（空）'}</Code>}
                        />
                        {extension.attributes && extension.attributes.length > 0 ? (
                          <FieldRow
                            label="attributes"
                            value={extension.attributes.map((item) => (
                              <Tag key={item}>{item}</Tag>
                            ))}
                          />
                        ) : null}
                        {extension.keywords && extension.keywords.length > 0 ? (
                          <FieldRow
                            label="keywords"
                            value={extension.keywords.map((keyword) => (
                              <Tag key={keyword.key} color="blue">
                                {keyword.key}
                                {keyword.type.length > 0 ? `=${keyword.type.join('-')}` : ' (开关)'}
                              </Tag>
                            ))}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="私有 privateuse">
                {result.privateUse.length > 0 ? (
                  <Space size={4} wrap>
                    {result.privateUse.map((item) => (
                      <Tag key={item} color="purple">
                        {item}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
            </Descriptions>

            {intlCross ? (
              <Alert
                type="info"
                showIcon
                className={styles.alert}
                message="Intl.Locale 交叉验证"
                description={
                  <span>
                    原生解析：language=<Code>{intlCross.language ?? '—'}</Code>，script=
                    <Code>{intlCross.script ?? '—'}</Code>，region=
                    <Code>{intlCross.region ?? '—'}</Code>
                  </span>
                }
              />
            ) : null}
          </Card>

          <Card className={styles.card} title="诊断与规范化建议">
            {result.diagnostics.length === 0 ? (
              <Alert type="success" showIcon message="未发现结构问题，标签符合 BCP 47 语法。" />
            ) : (
              <Space direction="vertical" size={8} className={styles.alertStack}>
                {result.diagnostics.map((diagnostic, index) => (
                  <Alert
                    key={`${index}-${diagnostic.message}`}
                    type={diagnostic.level === 'error' ? 'error' : 'warning'}
                    showIcon
                    message={
                      <Space size={8}>
                        <Tag color={diagnostic.level === 'error' ? 'red' : 'gold'}>
                          {diagnostic.level}
                        </Tag>
                        {diagnostic.subtag ? <Code>{diagnostic.subtag}</Code> : null}
                        <span>{diagnostic.message}</span>
                      </Space>
                    }
                  />
                ))}
              </Space>
            )}
            {result.suggestions.length > 0 ? (
              <div className={styles.suggestions}>
                {result.suggestions.map((text) => (
                  <Alert key={text} type="info" showIcon message={text} />
                ))}
              </div>
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
};

export default Bcp47LanguageTag;
