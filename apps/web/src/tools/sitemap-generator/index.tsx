'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Select, Space, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  generateSitemap,
  validateChangefreq,
  validatePriority,
  type SitemapOptions,
} from './utils/sitemap';
import { CHANGEFREQ_OPTIONS, DEFAULT_OPTIONS, DEFAULT_URLS } from './constants';
import styles from './index.module.css';

/**
 * sitemap.xml 生成器：粘贴 URL 清单并设置全局 lastmod / changefreq / priority，
 * 实时生成符合 sitemaps.org 协议的 urlset XML，非法 URL 与超量截断均有提示。
 *
 * @returns sitemap.xml 生成器交互界面
 */
const SitemapGenerator: React.FC<ToolComponentProps> = () => {
  const [urlText, setUrlText] = React.useState<string>(DEFAULT_URLS);
  const [options, setOptions] = React.useState<SitemapOptions>(DEFAULT_OPTIONS);

  const result = React.useMemo(() => generateSitemap(urlText, options), [urlText, options]);
  const priorityError = React.useMemo(
    () => validatePriority(options.priority),
    [options.priority],
  );
  const changefreqError = React.useMemo(
    () => validateChangefreq(options.changefreq),
    [options.changefreq],
  );

  const updateOption = (key: keyof SitemapOptions, value: string): void => {
    setOptions((previous) => ({ ...previous, [key]: value }));
  };

  const resetSample = (): void => {
    setUrlText(DEFAULT_URLS);
    setOptions(DEFAULT_OPTIONS);
  };

  const clearAll = (): void => {
    setUrlText('');
    setOptions({ lastmod: '', changefreq: '', priority: '' });
  };

  const copyOutput = async (): Promise<void> => {
    if (result.xml === '') {
      message.warning('暂无有效 URL');
      return;
    }
    await copyToClipboard(result.xml);
    message.success('sitemap.xml 内容已复制');
  };

  return (
    <div className={styles.container}>
      <Card
        title="URL 清单（每行一条，仅支持 http / https）"
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
        <Input.TextArea
          value={urlText}
          onChange={(event) => setUrlText(event.target.value)}
          placeholder={'https://example.com/\nhttps://example.com/about'}
          autoSize={{ minRows: 6, maxRows: 16 }}
        />
      </Card>

      <Card title="全局选项（应用于每条 URL，留空则不输出该标签）">
        <div className={styles.optionRow}>
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>lastmod</span>
            <Input
              value={options.lastmod}
              onChange={(event) => updateOption('lastmod', event.target.value)}
              placeholder="YYYY-MM-DD"
              style={{ width: 180 }}
            />
          </div>
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>changefreq</span>
            <Select
              value={options.changefreq}
              onChange={(value: string) => updateOption('changefreq', value)}
              options={CHANGEFREQ_OPTIONS}
              style={{ width: 200 }}
            />
          </div>
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>priority</span>
            <Input
              value={options.priority}
              onChange={(event) => updateOption('priority', event.target.value)}
              placeholder="0.0 – 1.0"
              status={priorityError ? 'error' : undefined}
              style={{ width: 140 }}
            />
          </div>
        </div>
        {priorityError ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message={priorityError} />
        ) : null}
        {changefreqError ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message={changefreqError} />
        ) : null}
      </Card>

      {result.invalid.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={`${result.invalid.length} 条 URL 非法，已跳过（行号按非空行计数）`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {result.invalid.slice(0, 20).map((item) => (
                <li key={item.line}>
                  第 {item.line} 行：{item.url} —— {item.reason}
                </li>
              ))}
              {result.invalid.length > 20 ? (
                <li>其余 {result.invalid.length - 20} 条略……</li>
              ) : null}
            </ul>
          }
        />
      ) : null}

      {result.exceedsLimit ? (
        <Alert
          type="warning"
          showIcon
          message="URL 数量超过单文件上限 50000 条"
          description="sitemaps.org 协议规定单个 sitemap 最多包含 50000 条 URL，已仅写入前 50000 条；超出部分请使用 sitemap index 拆分到多个文件。"
        />
      ) : null}

      <Card
        title={`sitemap.xml 预览（${result.count} 条 URL）`}
        extra={
          <Button type="primary" icon={<CopyOutlined />} onClick={copyOutput}>
            复制
          </Button>
        }
      >
        {result.xml === '' ? (
          <Empty description="尚无有效 URL" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <pre className={styles.output}>{result.xml}</pre>
        )}
        <div className={styles.hint}>
          全部内容仅在浏览器本地拼装，不发起任何网络请求；生成后请将文件部署到站点根目录并在 robots.txt
          中声明 Sitemap 地址。
        </div>
      </Card>
    </div>
  );
};

export default SitemapGenerator;
