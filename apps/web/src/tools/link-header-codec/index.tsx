'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { SAMPLE_BASES, SAMPLE_HEADERS } from './constants';
import {
  buildLinkHeader,
  parseLinkHeader,
  type LinkBuildEntry,
} from './utils/linkHeader';
import styles from './index.module.css';

type Mode = 'parse' | 'build';

interface BuildRow {
  uri: string;
  rel: string;
  type: string;
}

const DEFAULT_ROWS: BuildRow[] = [
  { uri: 'https://a.test/next', rel: 'next', type: '' },
  { uri: '/feed', rel: 'alternate', type: 'application/atom+xml' },
];

/**
 * RFC 8288 HTTP Link 头解析与构造器。
 * 解析：尊重尖括号与引号字符串，按顶层逗号切分多个 link-value，提取
 * rel/anchor/hreflang/type/media/title 等参数；构造：结构化条目反向生成头值。
 */
const LinkHeaderCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('parse');
  const [header, setHeader] = React.useState<string>(defaultInput ?? SAMPLE_HEADERS[0] ?? '');
  const [baseUri, setBaseUri] = React.useState<string>('');
  const [rows, setRows] = React.useState<BuildRow[]>(DEFAULT_ROWS);

  const parsed = React.useMemo(() => parseLinkHeader(header, baseUri || undefined), [header, baseUri]);

  const built = React.useMemo(() => {
    const entries: LinkBuildEntry[] = rows
      .filter((row) => row.uri.trim().length > 0)
      .map((row) => ({
        uriReference: row.uri.trim(),
        rel: row.rel
          .split(/[\s,]+/)
          .map((token) => token.trim())
          .filter((token) => token.length > 0),
        type: row.type.trim() || undefined,
      }));
    if (entries.length === 0) {
      return { ok: false as const, text: '', error: '至少需要一个非空 URI-Reference' };
    }
    return { ok: true as const, text: buildLinkHeader(entries), error: undefined };
  }, [rows]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const updateRow = (index: number, field: keyof BuildRow, value: string) => {
    setRows((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const paramColumns = [
    { title: '参数名', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'extended',
      key: 'extended',
      render: (extended: boolean) =>
        extended ? <Tag color="purple">ext</Tag> : <Tag>普通</Tag>,
    },
    { title: '值', dataIndex: 'value', key: 'value' },
  ];

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={[
          { label: '解析 Link 头', value: 'parse' },
          { label: '构造 Link 头', value: 'build' },
        ]}
      />

      {mode === 'parse' ? (
        <Card
          title="解析 RFC 8288 Link 头"
          extra={
            <Button size="small" onClick={() => setHeader(SAMPLE_HEADERS[0] ?? '')}>
              示例
            </Button>
          }
        >
          <Input.TextArea
            className={styles.mono}
            rows={4}
            value={header}
            onChange={(event) => setHeader(event.target.value)}
            placeholder={'<https://a.test/next>; rel="next", </feed>; rel="alternate"'}
          />
          <div className={styles.samples}>
            {SAMPLE_HEADERS.map((sample) => (
              <Tag
                key={sample}
                className={styles.mono}
                onClick={() => sample !== undefined && setHeader(sample)}
              >
                {sample.length > 44 ? `${sample.slice(0, 44)}…` : sample}
              </Tag>
            ))}
          </div>

          <div className={styles.field} style={{ marginTop: 12 }}>
            <label>可选 base URI（提供后按 RFC 3986 归一相对引用，留空则原样保留）</label>
            <Input
              className={styles.mono}
              value={baseUri}
              onChange={(event) => setBaseUri(event.target.value)}
              placeholder="例如 https://a.test/b/c/d;p?q"
            />
            <div className={styles.samples}>
              {SAMPLE_BASES.map((sample) => (
                <Tag key={sample} className={styles.mono} onClick={() => setBaseUri(sample)}>
                  {sample}
                </Tag>
              ))}
            </div>
          </div>

          {parsed.ok ? (
            parsed.links.map((link, index) => (
              <Card
                key={`${link.uriReference}-${index}`}
                type="inner"
                className={styles.linkCard}
                title={
                  <Space>
                    <span>
                      条目 {index + 1}
                    </span>
                    {link.rel.map((relation) => (
                      <Tag key={relation} color="blue">
                        rel={relation}
                      </Tag>
                    ))}
                  </Space>
                }
                extra={
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(link.resolvedUri ?? link.uriReference)}
                  >
                    复制 URI
                  </Button>
                }
              >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <span>
                    URI-Reference：
                    <strong className={styles.mono}>{link.uriReference}</strong>
                  </span>
                  {link.resolvedUri ? (
                    <span className={styles.hint}>
                      归一后绝对 URI：
                      <span className={styles.mono}>{link.resolvedUri}</span>
                    </span>
                  ) : null}
                  {link.anchor ? <span>anchor：<span className={styles.mono}>{link.anchor}</span></span> : null}
                  {link.hreflang ? <span>hreflang：<span className={styles.mono}>{link.hreflang}</span></span> : null}
                  {link.type ? <span>type：<span className={styles.mono}>{link.type}</span></span> : null}
                  {link.media ? <span>media：<span className={styles.mono}>{link.media}</span></span> : null}
                  {link.title ? <span>title：<span className={styles.mono}>{link.title}</span></span> : null}
                  <Table
                    size="small"
                    rowKey="name"
                    columns={paramColumns}
                    dataSource={link.params}
                    pagination={false}
                  />
                </Space>
              </Card>
            ))
          ) : (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message="解析失败"
              description={parsed.error}
            />
          )}
        </Card>
      ) : (
        <Card
          title="构造 Link 头"
          extra={
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setRows((previous) => [...previous, { uri: '', rel: '', type: '' }])}
            >
              新增条目
            </Button>
          }
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {rows.map((row, index) => (
              <Card
                key={index}
                type="inner"
                size="small"
                title={`条目 ${index + 1}`}
                extra={
                  rows.length > 1 ? (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        setRows((previous) => previous.filter((_, rowIndex) => rowIndex !== index))
                      }
                    />
                  ) : null
                }
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Input
                    className={styles.mono}
                    placeholder="URI-Reference，例如 /feed 或 https://a.test/next"
                    value={row.uri}
                    onChange={(event) => updateRow(index, 'uri', event.target.value)}
                  />
                  <Input
                    placeholder="rel 关系类型，空格或逗号分隔，例如 next preload"
                    value={row.rel}
                    onChange={(event) => updateRow(index, 'rel', event.target.value)}
                  />
                  <Input
                    className={styles.mono}
                    placeholder="可选 type，例如 application/atom+xml"
                    value={row.type}
                    onChange={(event) => updateRow(index, 'type', event.target.value)}
                  />
                </Space>
              </Card>
            ))}

            {built.ok ? (
              <>
                <div className={`${styles.resultBox} ${styles.mono}`}>{built.text}</div>
                <Button
                  size="small"
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(built.text)}
                >
                  复制 Link 头
                </Button>
              </>
            ) : (
              <Alert type="error" showIcon message="构造失败" description={built.error} />
            )}
          </Space>
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        message="Link 头速记（RFC 8288）"
        description={
          <div className={styles.hint}>
            <p>
              头值由一个或多个 link-value 组成，顶层用逗号分隔；每个 link-value
              以尖括号包裹的 URI-Reference 开头，后跟若干
              <span className={styles.mono}> name=value </span>
              参数，参数之间用分号分隔。引号字符串与尖括号内部的逗号、分号不参与切分。
            </p>
            <p>
              <span className={styles.mono}>rel</span>
              是空白分隔的关系类型集合（如 next、preload、alternate），解析时统一小写归一；
              <span className={styles.mono}> anchor/hreflang/type/media/title </span>
              为常用目标属性。提供 base 时，相对引用可按 RFC 3986
              归一为绝对 URI（仅展示，不修改原始引用）。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default LinkHeaderCodec;
