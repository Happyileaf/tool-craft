'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  DESCRIPTION_RECOMMENDED_MAX,
  TITLE_RECOMMENDED_MAX,
  generateMetaTags,
  type MetaInput,
} from './utils/meta';
import {
  OG_TYPE_OPTIONS,
  ROBOTS_PRESETS,
  TWITTER_CARD_OPTIONS,
  createEmptyMeta,
  createSampleMeta,
} from './constants';
import styles from './index.module.css';

/**
 * Open Graph / SEO 元标签生成器：填写标题、描述、规范链接、
 * 分享图与社交账号后实时生成可粘贴到 <head> 的 title / meta /
 * link 片段（含 og:* 与 twitter:*），并提供分享卡片预览与校验提示。
 * 全部拼装在浏览器本地完成。
 *
 * @returns 元标签生成器交互界面
 */
const OgMetaGenerator: React.FC<ToolComponentProps> = () => {
  const [form, setForm] = React.useState<MetaInput>(createSampleMeta);

  const result = React.useMemo(() => generateMetaTags(form), [form]);

  /**
   * 更新单个字段
   *
   * @param key - 字段名
   * @param value - 新值
   */
  const update = (key: keyof MetaInput, value: string): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  /**
   * 复制生成的 HTML
   */
  const handleCopy = async (): Promise<void> => {
    if (result.html === '') {
      message.warning('暂无可复制内容');
      return;
    }
    await copyToClipboard(result.html);
    message.success('元标签 HTML 已复制');
  };

  const errors = result.issues.filter((issue) => issue.level === 'error');
  const warnings = result.issues.filter((issue) => issue.level === 'warning');

  return (
    <div className={styles.container}>
      <Card
        title="页面基础信息"
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => setForm(createSampleMeta())}>
              载入示例
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setForm(createEmptyMeta())}>
              清空
            </Button>
          </Space>
        }
      >
        <div className={styles.field}>
          <div className={styles.fieldLabel}>
            <span>页面标题 title</span>
            <span className={form.title.trim().length > TITLE_RECOMMENDED_MAX ? styles.counterWarn : styles.counter}>
              {form.title.trim().length}/{TITLE_RECOMMENDED_MAX}
            </span>
          </div>
          <Input
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="建议 60 字符以内，包含核心关键词"
          />
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>
            <span>描述 description</span>
            <span className={form.description.trim().length > DESCRIPTION_RECOMMENDED_MAX ? styles.counterWarn : styles.counter}>
              {form.description.trim().length}/{DESCRIPTION_RECOMMENDED_MAX}
            </span>
          </div>
          <Input.TextArea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="建议 160 字符以内，概括页面内容"
            autoSize={{ minRows: 2, maxRows: 5 }}
          />
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>规范链接 canonical（必填）</div>
            <Input
              value={form.url}
              onChange={(event) => update('url', event.target.value)}
              placeholder="https://example.com/article"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>站点名称 og:site_name</div>
            <Input
              value={form.siteName}
              onChange={(event) => update('siteName', event.target.value)}
              placeholder="如 DevTools"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>og:type</div>
            <Select
              className={styles.fullWidth}
              value={form.ogType}
              onChange={(value) => update('ogType', value)}
              options={OG_TYPE_OPTIONS}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>og:locale</div>
            <Input
              value={form.locale}
              onChange={(event) => update('locale', event.target.value)}
              placeholder="zh_CN"
            />
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>关键词 keywords（逗号分隔）</div>
            <Input
              value={form.keywords}
              onChange={(event) => update('keywords', event.target.value)}
              placeholder="SEO, Open Graph"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>作者 author</div>
            <Input
              value={form.author}
              onChange={(event) => update('author', event.target.value)}
              placeholder="可留空"
            />
          </div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>robots 指令（可留空）</div>
          <Space wrap>
            <Select
              style={{ minWidth: 200 }}
              value={form.robots || undefined}
              onChange={(value) => update('robots', value)}
              placeholder="选择常用指令"
              allowClear
              options={ROBOTS_PRESETS.map((value) => ({ value, label: value }))}
            />
            <Input
              style={{ minWidth: 220 }}
              value={form.robots}
              onChange={(event) => update('robots', event.target.value)}
              placeholder="或自定义，如 index, follow, max-image-preview:large"
            />
          </Space>
        </div>
      </Card>

      <Card title="分享图 Open Graph image">
        <div className={styles.grid}>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>图片 URL</div>
            <Input
              value={form.imageUrl}
              onChange={(event) => update('imageUrl', event.target.value)}
              placeholder="https://example.com/cover.png（建议 1200×630）"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>替代文字 og:image:alt</div>
            <Input
              value={form.imageAlt}
              onChange={(event) => update('imageAlt', event.target.value)}
              placeholder="图片内容描述"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>宽（像素）</div>
            <Input
              value={form.imageWidth}
              onChange={(event) => update('imageWidth', event.target.value)}
              placeholder="1200"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>高（像素）</div>
            <Input
              value={form.imageHeight}
              onChange={(event) => update('imageHeight', event.target.value)}
              placeholder="630"
            />
          </div>
        </div>
      </Card>

      <Card title="Twitter / X 卡片">
        <div className={styles.grid}>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>卡片类型 twitter:card</div>
            <Select
              className={styles.fullWidth}
              value={form.twitterCard}
              onChange={(value) => update('twitterCard', value)}
              options={TWITTER_CARD_OPTIONS}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>站点账号 twitter:site</div>
            <Input
              value={form.twitterSite}
              onChange={(event) => update('twitterSite', event.target.value)}
              placeholder="@example（可不带 @）"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>作者账号 twitter:creator</div>
            <Input
              value={form.twitterCreator}
              onChange={(event) => update('twitterCreator', event.target.value)}
              placeholder="@author（可不带 @）"
            />
          </div>
        </div>
      </Card>

      {errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message="存在必须修复的问题"
          description={
            <ul className={styles.issueList}>
              {errors.map((issue) => (
                <li key={issue.message}>{issue.message}</li>
              ))}
            </ul>
          }
        />
      ) : null}
      {warnings.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="优化建议"
          description={
            <ul className={styles.issueList}>
              {warnings.map((issue) => (
                <li key={issue.message}>{issue.message}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card title="分享卡片预览（社交平台抓取后的近似效果）">
        <div className={styles.previewCard}>
          {form.imageUrl.trim() ? (
            <div className={styles.previewImageWrap}>
              <img className={styles.previewImage} src={form.imageUrl} alt={form.imageAlt} />
            </div>
          ) : (
            <div className={styles.previewPlaceholder}>og:image</div>
          )}
          <div className={styles.previewBody}>
            <div className={styles.previewSite}>{form.siteName.trim() || form.url.trim() || 'example.com'}</div>
            <div className={styles.previewTitle}>{form.title.trim() || '页面标题预览'}</div>
            <div className={styles.previewDesc}>
              {form.description.trim() || '页面描述会显示在这里，建议控制在 160 字符以内。'}
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="生成的 HTML（粘贴到页面 <head> 中）"
        extra={
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制 HTML
          </Button>
        }
      >
        <pre className={styles.output}>{result.html}</pre>
        <div className={styles.hint}>
          所有标签均在浏览器本地拼装，不发起任何网络请求；空字段对应的标签不会输出，属性值已做 HTML 转义。
        </div>
      </Card>
    </div>
  );
};

export default OgMetaGenerator;
