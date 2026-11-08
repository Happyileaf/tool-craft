'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  parseLrc,
  serializeLrc,
  parseTimestampedLyrics,
  formatTimestamp,
  type LrcLine,
  type LrcTag,
} from './utils/lrc';
import { SAMPLE_LRC, SAMPLE_PLAIN_LYRICS, TAG_KEYS, TAG_LABELS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'generate' | 'parse';

/** 把毫秒渲染为 mm:ss.cc 便于表格阅读 */
function renderTime(timeMs: number): string {
  return formatTimestamp(timeMs).slice(1, -1);
}

/**
 * LRC 歌词时间戳生成与解析器：在逐行时间戳歌词与标准 LRC 文本之间双向转换，
 * 支持 ID 标签、行内多时间戳展开与错误定位，全部本地运算。
 */
const LrcParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('generate');
  const [plainInput, setPlainInput] = React.useState(defaultInput ?? SAMPLE_PLAIN_LYRICS);
  const [lrcInput, setLrcInput] = React.useState(SAMPLE_LRC);
  const [tagValues, setTagValues] = React.useState<Record<string, string>>({
    ti: '示例歌曲',
    ar: '示例歌手',
    al: '示例专辑',
    by: '',
  });

  /** 生成模式：逐行歌词 -> 结构化条目 -> LRC */
  const generated = React.useMemo<{ lines?: LrcLine[]; output?: string; error?: string }>(() => {
    try {
      const lines = parseTimestampedLyrics(plainInput);
      const tags: LrcTag[] = TAG_KEYS.filter((key) => tagValues[key]?.trim()).map((key) => ({
        key,
        value: tagValues[key].trim(),
      }));
      return { lines, output: serializeLrc(lines, { tags }) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [plainInput, tagValues]);

  /** 解析模式：LRC 文本 -> 标签 + 条目 + 错误 */
  const parsed = React.useMemo(() => parseLrc(lrcInput), [lrcInput]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const columns = [
    {
      title: '时间戳',
      dataIndex: 'timeMs',
      key: 'timeMs',
      width: 120,
      render: (timeMs: number) => <span className={styles.mono}>{renderTime(timeMs)}</span>,
    },
    {
      title: '歌词文本',
      dataIndex: 'text',
      key: 'text',
      render: (text: string) => text || <Tag color="default">纯伴奏行</Tag>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="LRC 歌词时间戳生成与解析器"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() =>
              handleCopy(mode === 'generate' ? generated.output ?? '' : lrcInput)
            }
          >
            复制 LRC
          </Button>
        }
      >
        <p className={styles.hint}>
          生成模式把「mm:ss.cc 歌词」逐行文本拼装为标准 LRC；解析模式把 LRC 还原为可核对的时间轴表格，
          自动展开行内多时间戳并识别 ti/ar/al/by/offset 标签。全部处理在浏览器本地完成。
        </p>

        <div className={styles.modeBar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={[
              { value: 'generate', label: '逐行歌词 → LRC' },
              { value: 'parse', label: 'LRC → 时间轴表格' },
            ]}
            onChange={(event) => setMode(event.target.value as Mode)}
          />
          <Button
            size="small"
            onClick={() =>
              mode === 'generate' ? setPlainInput(SAMPLE_PLAIN_LYRICS) : setLrcInput(SAMPLE_LRC)
            }
          >
            载入示例
          </Button>
        </div>

        {mode === 'generate' ? (
          <div className={styles.paneGrid} style={{ marginTop: 16 }}>
            <div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <span className={styles.hint}>每行格式：mm:ss.cc 空格 歌词文本</span>
                <Input.TextArea
                  className={styles.textarea}
                  rows={14}
                  spellCheck={false}
                  value={plainInput}
                  onChange={(event) => setPlainInput(event.target.value)}
                />
                {TAG_KEYS.map((key) => (
                  <Input
                    key={key}
                    size="small"
                    addonBefore={TAG_LABELS[key]}
                    placeholder={`[${key}] 标签，留空省略`}
                    value={tagValues[key]}
                    onChange={(event) =>
                      setTagValues((previous) => ({ ...previous, [key]: event.target.value }))
                    }
                  />
                ))}
              </Space>
              {generated.error ? (
                <Alert style={{ marginTop: 12 }} type="warning" showIcon message={generated.error} />
              ) : null}
            </div>
            <div>
              <span className={styles.hint}>生成的 LRC（CRLF 行尾，可直接保存为 .lrc）</span>
              <Input.TextArea
                className={styles.textarea}
                rows={18}
                spellCheck={false}
                readOnly
                value={generated.output ?? ''}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <Input.TextArea
              className={styles.textarea}
              rows={10}
              spellCheck={false}
              value={lrcInput}
              onChange={(event) => setLrcInput(event.target.value)}
            />
            {parsed.errors.length > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message={`发现 ${parsed.errors.length} 个格式问题`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {parsed.errors.map((error) => (
                      <li key={error} className={styles.mono}>
                        {error}
                      </li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            <Space style={{ marginTop: 12 }} wrap>
              {parsed.tags.length === 0 ? (
                <span className={styles.hint}>未识别到 ID 标签</span>
              ) : (
                parsed.tags.map((tag) => (
                  <Tag key={tag.key} color="blue">
                    {TAG_LABELS[tag.key] ?? tag.key}：{tag.value}
                  </Tag>
                ))
              )}
            </Space>
            {parsed.lines.length === 0 ? (
              <Empty style={{ marginTop: 24 }} description="暂无可展示的歌词条目" />
            ) : (
              <Table
                style={{ marginTop: 12 }}
                size="small"
                pagination={false}
                rowKey={(record) => `${record.timeMs}-${record.text}`}
                columns={columns}
                dataSource={parsed.lines}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default LrcParser;
