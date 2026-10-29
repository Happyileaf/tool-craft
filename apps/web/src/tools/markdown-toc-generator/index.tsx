'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Col, Empty, Input, Row, Segmented, Space, Switch, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_TOC_OPTIONS,
  extractHeadings,
  generateToc,
  insertToc,
  type TocOptions,
} from './utils/toc';
import { DEFAULT_MARKDOWN } from './constants';
import styles from './index.module.css';

/** 层级 1–6 的小数字输入（内联组件，避免再开文件） */
const InputNumberLevel: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <Space size={4}>
    <span>{label}</span>
    <Input
      type="number"
      value={value}
      min={1}
      max={6}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (Number.isInteger(next) && next >= 1 && next <= 6) {
          onChange(next);
        }
      }}
      style={{ width: 64 }}
    />
  </Space>
);

/**
 * Markdown 目录生成器：左栏粘贴 Markdown，选项实时控制有序/无序、
 * 层级范围与锚点链接，右栏展示目录与插入目录后的全文，一键复制。
 *
 * @returns Markdown TOC 生成器交互界面
 */
const MarkdownTocGenerator: React.FC<ToolComponentProps> = () => {
  const [markdown, setMarkdown] = React.useState<string>(DEFAULT_MARKDOWN);
  const [options, setOptions] = React.useState<TocOptions>(DEFAULT_TOC_OPTIONS);

  const headings = React.useMemo(() => extractHeadings(markdown), [markdown]);
  const toc = React.useMemo(() => generateToc(headings, options), [headings, options]);
  const merged = React.useMemo(() => insertToc(markdown, toc), [markdown, toc]);

  const updateOption = <K extends keyof TocOptions>(key: K, value: TocOptions[K]): void => {
    setOptions((previous) => ({ ...previous, [key]: value }));
  };

  const resetSample = (): void => {
    setMarkdown(DEFAULT_MARKDOWN);
    setOptions(DEFAULT_TOC_OPTIONS);
  };

  const clearAll = (): void => {
    setMarkdown('');
  };

  const copyToc = async (): Promise<void> => {
    if (toc === '') {
      message.warning('暂无可生成的目录');
      return;
    }
    await copyToClipboard(toc);
    message.success('目录已复制');
  };

  const copyMerged = async (): Promise<void> => {
    await copyToClipboard(merged);
    message.success('已复制插入目录后的全文');
  };

  return (
    <div className={styles.container}>
      <Card
        title="选项"
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={resetSample}>
              载入示例
            </Button>
            <Button size="small" onClick={clearAll}>
              清空
            </Button>
          </Space>
        }
      >
        <div className={styles.optionRow}>
          <span>列表样式</span>
          <Segmented
            value={options.ordered ? 'ordered' : 'unordered'}
            onChange={(value) => updateOption('ordered', value === 'ordered')}
            options={[
              { value: 'unordered', label: '无序列表 -' },
              { value: 'ordered', label: '有序列表 1.' },
            ]}
          />
          <span>层级范围</span>
          <InputNumberLevel
            label="最小"
            value={options.minLevel}
            onChange={(value) => updateOption('minLevel', value)}
          />
          <InputNumberLevel
            label="最大"
            value={options.maxLevel}
            onChange={(value) => updateOption('maxLevel', value)}
          />
          <span>GitHub 锚点链接</span>
          <Switch
            checked={options.withLinks}
            onChange={(checked) => updateOption('withLinks', checked)}
          />
        </div>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title={`Markdown 原文（识别到 ${headings.length} 个标题）`}>
            <Input.TextArea
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              placeholder="# 标题&#10;粘贴你的 Markdown……"
              autoSize={{ minRows: 18, maxRows: 30 }}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="目录预览"
            extra={
              <Button size="small" type="primary" icon={<CopyOutlined />} onClick={copyToc}>
                复制目录
              </Button>
            }
          >
            {toc === '' ? (
              <Empty description="未识别到标题" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <pre className={styles.output}>{toc}</pre>
            )}
            <div className={styles.hint}>
              仅识别 ATX 风格（#）标题；围栏代码块（``` / ~~~）与行首转义 # 均会忽略。锚点遵循
              GitHub 规则：小写、空格转连字符、去除标点。
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="插入目录后的全文（含 &lt;!-- TOC --&gt; 标记时替换，否则前置）"
        extra={
          <Button icon={<CopyOutlined />} onClick={copyMerged}>
            复制全文
          </Button>
        }
      >
        <pre className={`${styles.output} ${styles.merged}`}>{merged}</pre>
      </Card>
    </div>
  );
};

export default MarkdownTocGenerator;
