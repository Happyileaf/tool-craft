'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, DownloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  buildPlaylist,
  formatTotalDuration,
  parsePlaylist,
  type M3uEntry,
} from './utils/m3u';
import { MODE_OPTIONS, PLAYLIST_TYPE_OPTIONS, SAMPLE_ENTRIES, SAMPLE_PLAYLIST } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'generate' | 'parse';
type PlaylistKind = 'basic' | 'hls';

/** 条目表格的行 key */
interface EntryRow extends M3uEntry {
  key: string;
}

let rowSeq = 0;
const createRow = (entry: Partial<M3uEntry> = {}): EntryRow => ({
  key: `row-${rowSeq++}`,
  uri: entry.uri ?? '',
  duration: entry.duration ?? null,
  title: entry.title ?? '',
});

/**
 * M3U / M3U8 播放列表生成与解析器：
 * 生成模式在结构化条目与播放列表文本间转换，解析模式还原 HLS 标签与分片表格。
 * 全部处理在浏览器本地完成，不发起任何媒体请求。
 */
const M3uPlaylistTool: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('generate');
  const [kind, setKind] = React.useState<PlaylistKind>('hls');
  const [rows, setRows] = React.useState<EntryRow[]>(() => SAMPLE_ENTRIES.map(createRow));
  const [version, setVersion] = React.useState<number>(3);
  const [mediaSequence, setMediaSequence] = React.useState<number | null>(0);
  const [playlistType, setPlaylistType] = React.useState<'' | 'VOD' | 'EVENT'>('VOD');
  const [endList, setEndList] = React.useState<boolean>(true);
  const [parseInput, setParseInput] = React.useState(defaultInput ?? SAMPLE_PLAYLIST);

  /** 生成结果（错误不外抛） */
  const generated = React.useMemo<{ output?: string; error?: string }>(() => {
    try {
      const entries: M3uEntry[] = rows.map(({ uri, duration, title }) => ({
        uri,
        duration: kind === 'hls' && duration === null ? null : duration,
        title,
      }));
      const output = buildPlaylist({
        mode: kind,
        entries,
        hls:
          kind === 'hls'
            ? {
                version,
                mediaSequence: mediaSequence ?? undefined,
                playlistType: playlistType || undefined,
                endList,
              }
            : undefined,
      });
      return { output };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [rows, kind, version, mediaSequence, playlistType, endList]);

  /** 解析结果 */
  const parsed = React.useMemo(() => parsePlaylist(parseInput), [parseInput]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const handleDownload = () => {
    if (!generated.output) {
      message.warning('暂无可下载的内容');
      return;
    }
    const blob = new Blob([generated.output], { type: 'application/vnd.apple.mpegurl' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = kind === 'hls' ? 'playlist.m3u8' : 'playlist.m3u';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateRow = (key: string, patch: Partial<EntryRow>) => {
    setRows((previous) => previous.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const entryColumns = [
    {
      title: '资源 URI / 路径',
      dataIndex: 'uri',
      key: 'uri',
      render: (_: unknown, record: EntryRow) => (
        <Input
          size="small"
          placeholder="seg-0.ts 或 https://…"
          value={record.uri}
          onChange={(event) => updateRow(record.key, { uri: event.target.value })}
        />
      ),
    },
    {
      title: '时长（秒）',
      dataIndex: 'duration',
      key: 'duration',
      width: 130,
      render: (_: unknown, record: EntryRow) => (
        <InputNumber
          size="small"
          min={0}
          step={0.1}
          style={{ width: '100%' }}
          placeholder={kind === 'hls' ? 'HLS 必填' : '可空'}
          value={record.duration}
          onChange={(value) => updateRow(record.key, { duration: value })}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 160,
      render: (_: unknown, record: EntryRow) => (
        <Input
          size="small"
          placeholder="#EXTINF 标题，可空"
          value={record.title}
          onChange={(event) => updateRow(record.key, { title: event.target.value })}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_: unknown, record: EntryRow) => (
        <Button
          size="small"
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => setRows((previous) => previous.filter((row) => row.key !== record.key))}
        />
      ),
    },
  ];

  const parsedColumns = [
    { title: '#', key: 'index', width: 52, render: (_: unknown, __: unknown, index: number) => index + 1 },
    {
      title: 'URI',
      dataIndex: 'uri',
      key: 'uri',
      render: (text: string) => <span className={styles.mono}>{text || <Tag color="error">缺失</Tag>}</span>,
    },
    {
      title: '时长（秒）',
      dataIndex: 'duration',
      key: 'duration',
      width: 110,
      render: (value: number | null) => (value === null ? '—' : value),
    },
    { title: '标题', dataIndex: 'title', key: 'title', width: 180, render: (text: string) => text || '—' },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="M3U / M3U8 播放列表生成与解析器"
        extra={
          <Space>
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(generated.output ?? parseInput)}>
              复制
            </Button>
            {mode === 'generate' ? (
              <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                下载 .{kind === 'hls' ? 'm3u8' : 'm3u'}
              </Button>
            ) : null}
          </Space>
        }
      >
        <p className={styles.hint}>
          在结构化条目与 M3U/M3U8 文本之间双向转换，支持普通播放列表与 HLS 媒体序列（VERSION / TARGETDURATION /
          MEDIA-SEQUENCE / PLAYLIST-TYPE / ENDLIST）。纯本地文本处理，不发起任何网络请求。
        </p>

        <div className={styles.modeBar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={[
              { value: 'generate', label: '生成播放列表' },
              { value: 'parse', label: '解析播放列表' },
            ]}
            onChange={(event) => setMode(event.target.value as Mode)}
          />
          <Button
            size="small"
            onClick={() => {
              setRows(SAMPLE_ENTRIES.map(createRow));
              setParseInput(SAMPLE_PLAYLIST);
            }}
          >
            载入示例
          </Button>
        </div>

        {mode === 'generate' ? (
          <div className={styles.paneGrid} style={{ marginTop: 16 }}>
            <div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Radio.Group
                  optionType="button"
                  size="small"
                  value={kind}
                  options={MODE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                  onChange={(event) => setKind(event.target.value as PlaylistKind)}
                />
                {kind === 'hls' ? (
                  <div className={styles.hlsBar}>
                    <span className={styles.hint}>VERSION</span>
                    <InputNumber
                      size="small"
                      min={1}
                      precision={0}
                      style={{ width: 72 }}
                      value={version}
                      onChange={(value) => setVersion(value ?? 3)}
                    />
                    <span className={styles.hint}>MEDIA-SEQUENCE</span>
                    <InputNumber
                      size="small"
                      min={0}
                      precision={0}
                      style={{ width: 90 }}
                      value={mediaSequence}
                      onChange={setMediaSequence}
                    />
                    <span className={styles.hint}>PLAYLIST-TYPE</span>
                    <Select
                      size="small"
                      style={{ width: 110 }}
                      value={playlistType}
                      options={PLAYLIST_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                      onChange={(value) => setPlaylistType(value)}
                    />
                    <Checkbox checked={endList} onChange={(event) => setEndList(event.target.checked)}>
                      追加 #EXT-X-ENDLIST
                    </Checkbox>
                  </div>
                ) : null}
                <Table
                  size="small"
                  pagination={false}
                  rowKey="key"
                  columns={entryColumns}
                  dataSource={rows}
                  locale={{ emptyText: <Empty description="暂无条目" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
                <Button
                  block
                  icon={<PlusOutlined />}
                  onClick={() => setRows((previous) => [...previous, createRow()])}
                >
                  新增条目
                </Button>
              </Space>
              {generated.error ? (
                <Alert style={{ marginTop: 12 }} type="error" showIcon message={generated.error} />
              ) : null}
            </div>
            <div>
              <span className={styles.hint}>生成结果（可直接保存为 .m3u / .m3u8）</span>
              <Input.TextArea
                className={styles.textarea}
                rows={22}
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
              rows={12}
              spellCheck={false}
              value={parseInput}
              onChange={(event) => setParseInput(event.target.value)}
            />
            <div className={styles.statRow}>
              <Tag color={parsed.hasHeader ? 'green' : 'orange'}>
                {parsed.hasHeader ? '含 #EXTM3U 头' : '缺 #EXTM3U 头'}
              </Tag>
              <Tag color={parsed.isHls ? 'blue' : 'default'}>{parsed.isHls ? 'HLS 播放列表' : '普通 M3U'}</Tag>
              <Tag>条目数：{parsed.entries.length}</Tag>
              <Tag>总时长：{formatTotalDuration(parsed.totalDuration)}</Tag>
              {parsed.hls.targetDuration !== null ? (
                <Tag>TARGETDURATION：{parsed.hls.targetDuration}s</Tag>
              ) : null}
              {parsed.hls.mediaSequence !== null ? (
                <Tag>MEDIA-SEQUENCE：{parsed.hls.mediaSequence}</Tag>
              ) : null}
              {parsed.hls.playlistType ? <Tag>TYPE：{parsed.hls.playlistType}</Tag> : null}
              {parsed.hls.endList ? <Tag color="purple">ENDLIST</Tag> : null}
            </div>
            {parsed.warnings.length > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message={`${parsed.warnings.length} 个警告`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {parsed.warnings.map((item) => (
                      <li key={item} className={styles.mono}>
                        {item}
                      </li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            {parsed.errors.length > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="error"
                showIcon
                message={`${parsed.errors.length} 个格式错误`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {parsed.errors.map((item) => (
                      <li key={item} className={styles.mono}>
                        {item}
                      </li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            {parsed.entries.length > 0 ? (
              <Table
                style={{ marginTop: 12 }}
                size="small"
                pagination={false}
                rowKey={(_, index) => `parsed-${index}`}
                columns={parsedColumns}
                dataSource={parsed.entries}
              />
            ) : (
              <Empty style={{ marginTop: 24 }} description="暂无可展示的条目" />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default M3uPlaylistTool;
