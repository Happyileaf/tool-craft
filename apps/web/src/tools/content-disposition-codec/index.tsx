'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Select, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { SAMPLE_FILENAMES, SAMPLE_HEADERS } from './constants';
import { buildContentDisposition, parseContentDisposition } from './utils/contentDisposition';
import styles from './index.module.css';

type Mode = 'parse' | 'build';

/**
 * Content-Disposition 响应头解析与构造器（RFC 6266 + RFC 8187）。
 * 解析：词法切分 disposition-type 与参数，filename* 按 ext-value 三段解码；
 * 构造：同时输出 ASCII 降级 filename 与 UTF-8 百分号编码的 filename*。
 */
const ContentDispositionCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('parse');
  const [header, setHeader] = React.useState<string>(defaultInput ?? SAMPLE_HEADERS[0] ?? '');
  const [dispositionType, setDispositionType] = React.useState<string>('attachment');
  const [filename, setFilename] = React.useState<string>(SAMPLE_FILENAMES[0] ?? '');

  const parsed = React.useMemo(() => parseContentDisposition(header), [header]);

  const built = React.useMemo(() => {
    if (!filename) {
      return { ok: false as const, text: '', error: '文件名不能为空' };
    }
    return {
      ok: true as const,
      text: buildContentDisposition({ type: dispositionType, filename }),
      error: undefined,
    };
  }, [dispositionType, filename]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const columns = [
    { title: '参数名', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'extended',
      key: 'extended',
      render: (extended: boolean) =>
        extended ? <Tag color="purple">ext (filename*)</Tag> : <Tag>普通</Tag>,
    },
    { title: '解码后的值', dataIndex: 'value', key: 'value' },
  ];

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={[
          { label: '解析 Content-Disposition', value: 'parse' },
          { label: '构造 Content-Disposition', value: 'build' },
        ]}
      />

      {mode === 'parse' ? (
        <Card
          title="解析响应头"
          extra={
            <Button size="small" onClick={() => setHeader(SAMPLE_HEADERS[0] ?? '')}>
              示例
            </Button>
          }
        >
          <Input.TextArea
            className={styles.mono}
            rows={3}
            value={header}
            onChange={(event) => setHeader(event.target.value)}
            placeholder={
              "attachment; filename=\"a.pdf\"; filename*=UTF-8''%E6%8A%A5%E5%91%8A.pdf"
            }
          />
          <div className={styles.samples}>
            {SAMPLE_HEADERS.map((sample) => (
              <Tag
                key={sample}
                className={styles.mono}
                onClick={() => sample !== undefined && setHeader(sample)}
              >
                {sample.length > 40 ? `${sample.slice(0, 40)}…` : sample}
              </Tag>
            ))}
          </div>

          {parsed.ok ? (
            <Card type="inner" title="解析结果" style={{ marginTop: 12 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <span>
                  disposition-type：<Tag color="blue">{parsed.type}</Tag>
                </span>
                <span>
                  生效文件名（§4.2 优先级）：
                  <strong className={styles.mono}>{parsed.filename ?? '（无）'}</strong>
                  {parsed.filenameSource && parsed.filenameSource !== 'none' ? (
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      来自 {parsed.filenameSource}
                    </Tag>
                  ) : null}
                </span>
                <Table
                  size="small"
                  rowKey="name"
                  columns={columns}
                  dataSource={parsed.params}
                  pagination={false}
                />
              </Space>
              <Button
                size="small"
                icon={<CopyOutlined />}
                style={{ marginTop: 8 }}
                onClick={() => handleCopy(parsed.filename ?? '')}
              >
                复制生效文件名
              </Button>
            </Card>
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
        <Card title="构造响应头">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div className={styles.field}>
              <label>disposition-type</label>
              <Select
                value={dispositionType}
                style={{ width: 200 }}
                onChange={setDispositionType}
                options={[
                  { value: 'attachment', label: 'attachment（下载）' },
                  { value: 'inline', label: 'inline（内联展示）' },
                ]}
              />
            </div>
            <div className={styles.field}>
              <label>文件名（可含中文/空格/特殊字符）</label>
              <Input
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                placeholder="例如 报告.pdf"
              />
              <div className={styles.samples}>
                {SAMPLE_FILENAMES.map((sample) => (
                  <Tag
                    key={sample}
                    onClick={() => sample !== undefined && setFilename(sample)}
                  >
                    {sample}
                  </Tag>
                ))}
              </div>
            </div>

            {built.ok ? (
              <>
                <div className={`${styles.resultBox} ${styles.mono}`}>{built.text}</div>
                <Button
                  size="small"
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(built.text)}
                >
                  复制响应头
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
        message="Content-Disposition 速记（RFC 6266 / 8187）"
        description={
          <div className={styles.hint}>
            <p>
              头值由 disposition-type 与若干
              <span className={styles.mono}> name=value </span>
              参数组成，字符串值可用双引号包裹（反斜杠转义）。非 ASCII
              文件名必须使用扩展参数
              <span className={styles.mono}> filename* </span>
              ，其值为
              <span className={styles.mono}>{` charset'language'pct-encoded `}</span>
              三段结构，按 UTF-8 百分号编码。
            </p>
            <p>
              当 filename 与 filename* 同时存在时，按 §4.2
              优先采用扩展参数；构造时本工具同时生成 ASCII 降级
              <span className={styles.mono}> filename </span>
              与精确的
              <span className={styles.mono}> filename* </span>
              ，兼容旧客户端与现代浏览器。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default ContentDispositionCodec;
