'use client';

import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Segmented,
  Select,
  Space,
  message,
} from 'antd';
import { useMemo, useRef, useState } from 'react';
import {
  DEFAULT_FEED_META,
  FEED_FORMAT_OPTIONS,
  SAMPLE_FEED_ITEMS,
  type FeedItemForm,
} from './constants';
import { buildFeed, type FeedFormat } from './utils/feed';
import styles from './index.module.css';

const LANGUAGE_OPTIONS = [
  { label: '简体中文 (zh-CN)', value: 'zh-CN' },
  { label: '繁体中文 (zh-TW)', value: 'zh-TW' },
  { label: 'English (en)', value: 'en' },
  { label: '日本語 (ja)', value: 'ja' },
  { label: '한국어 (ko)', value: 'ko' },
];

export default function RssAtomGeneratorTool() {
  const [format, setFormat] = useState<FeedFormat>('rss');
  const [title, setTitle] = useState(DEFAULT_FEED_META.title);
  const [siteLink, setSiteLink] = useState(DEFAULT_FEED_META.siteLink);
  const [description, setDescription] = useState(DEFAULT_FEED_META.description);
  const [language, setLanguage] = useState(DEFAULT_FEED_META.language);
  const [updatedAt, setUpdatedAt] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<FeedItemForm[]>(SAMPLE_FEED_ITEMS);
  const nextKey = useRef(SAMPLE_FEED_ITEMS.length + 1);

  const result = useMemo<{ xml: string; error: string | null }>(() => {
    try {
      return {
        xml: buildFeed({
          format,
          title,
          siteLink,
          description,
          language,
          updatedAt,
          items,
        }),
        error: null,
      };
    } catch (error) {
      return { xml: '', error: error instanceof Error ? error.message : '生成失败' };
    }
  }, [format, title, siteLink, description, language, updatedAt, items]);

  const updateItem = (key: number, patch: Partial<FeedItemForm>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    const key = nextKey.current++;
    setItems((current) => [
      ...current,
      {
        key,
        title: '',
        link: '',
        pubDate: new Date().toISOString().slice(0, 10),
        description: '',
      },
    ]);
  };

  const removeItem = (key: number) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const handleCopy = async () => {
    if (result.xml === '') {
      message.warning('当前没有可复制的 XML');
      return;
    }
    try {
      await navigator.clipboard.writeText(result.xml);
      message.success('已复制 XML');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  const handleDownload = () => {
    if (result.xml === '') {
      return;
    }
    const blob = new Blob([result.xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = format === 'atom' ? 'atom.xml' : 'rss.xml';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Card
        title="Feed 信息"
        extra={
          <Segmented<FeedFormat>
            options={FEED_FORMAT_OPTIONS}
            value={format}
            onChange={setFormat}
          />
        }
      >
        <div className={styles.metaGrid}>
          <label className={styles.field}>
            <span className={styles.label}>站点标题 *</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>站点链接 *</span>
            <Input
              value={siteLink}
              onChange={(event) => setSiteLink(event.target.value)}
              placeholder="https://example.com"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>语言</span>
            <Select options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              Feed 更新时间{format === 'atom' ? ' *' : '（可选）'}
            </span>
            <Input
              value={updatedAt}
              onChange={(event) => setUpdatedAt(event.target.value)}
              placeholder="2026-11-15 或 2026-11-15T08:00:00Z"
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>站点描述</span>
          <Input.TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </label>
      </Card>

      <Card
        title={`文章条目（${items.length}）`}
        extra={
          <Button type="dashed" onClick={addItem}>
            添加条目
          </Button>
        }
      >
        <div className={styles.items}>
          {items.map((item, index) => (
            <div className={styles.item} key={item.key}>
              <div className={styles.itemHeader}>
                <span>条目 {index + 1}</span>
                <Button danger type="link" onClick={() => removeItem(item.key)}>
                  删除
                </Button>
              </div>
              <div className={styles.metaGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>标题 *</span>
                  <Input
                    value={item.title}
                    onChange={(event) => updateItem(item.key, { title: event.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>链接 *</span>
                  <Input
                    value={item.link}
                    onChange={(event) => updateItem(item.key, { link: event.target.value })}
                    placeholder="https://example.com/posts/1"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>发布时间 *</span>
                  <Input
                    value={item.pubDate}
                    onChange={(event) => updateItem(item.key, { pubDate: event.target.value })}
                    placeholder="2026-11-15"
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>摘要</span>
                <Input.TextArea
                  value={item.description}
                  onChange={(event) =>
                    updateItem(item.key, { description: event.target.value })
                  }
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </label>
              {index < items.length - 1 && <Divider />}
            </div>
          ))}
          {items.length === 0 && (
            <Alert type="info" showIcon message="暂无条目，仍可生成仅含频道信息的空 Feed。" />
          )}
        </div>
      </Card>

      {result.error && <Alert type="error" showIcon message={result.error} />}

      <Card
        title={`${format === 'atom' ? 'Atom 1.0' : 'RSS 2.0'} 输出`}
        extra={
          <Space>
            <Button onClick={handleCopy}>复制 XML</Button>
            <Button type="primary" onClick={handleDownload}>
              下载 .xml
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          className={styles.code}
          value={result.xml}
          readOnly
          autoSize={{ minRows: 14, maxRows: 26 }}
        />
      </Card>
    </div>
  );
}
