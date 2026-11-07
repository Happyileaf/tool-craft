"use client";

import React from "react";
import { Alert, Button, Card, Checkbox, Input, Radio, Select, Table, Tag, message } from "antd";
import { CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { ToolComponentProps } from "../loaders";
import { copyToClipboard } from "@/lib/utils";
import {
  M3U_MODE_OPTIONS,
  DEFAULT_PARSE_INPUT,
  DEFAULT_GENERATE_INPUT,
  M3uMode,
} from "./constants";
import {
  parsePlaylist,
  generatePlaylist,
  formatClock,
  type DraftEntry,
  type HlsOptions,
} from "./utils/m3u";
import styles from "./index.module.css";

interface EditableRow extends DraftEntry {
  key: string;
}

const M3uPlaylistParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<M3uMode>(M3uMode.PARSE);
  const [parseText, setParseText] = React.useState(defaultInput || DEFAULT_PARSE_INPUT);

  const parseResult = React.useMemo(() => parsePlaylist(parseText), [parseText]);

  // 生成模式状态
  const [rows, setRows] = React.useState<EditableRow[]>(() =>
    seedRows(DEFAULT_GENERATE_INPUT),
  );
  const [useHls, setUseHls] = React.useState(false);
  const [version, setVersion] = React.useState("3");
  const [targetDuration, setTargetDuration] = React.useState("8");
  const [mediaSequence, setMediaSequence] = React.useState("0");
  const [playlistType, setPlaylistType] = React.useState<string>("VOD");
  const [endlist, setEndlist] = React.useState(true);

  const generatedText = React.useMemo(() => {
    const validRows = rows.filter((row) => row.uri.trim() !== "");
    if (!useHls) {
      return generatePlaylist(validRows);
    }
    const hls: HlsOptions = {
      version: toNonNegInt(version),
      targetDuration: toNonNegInt(targetDuration),
      mediaSequence: toNonNegInt(mediaSequence),
      playlistType,
      endlist,
    };
    return generatePlaylist(validRows, hls);
  }, [rows, useHls, version, targetDuration, mediaSequence, playlistType, endlist]);

  const updateRow = (key: string, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { key: `${Date.now()}-${prev.length}`, duration: null, title: "", uri: "" }]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  };

  const handleCopyParse = () => {
    copyToClipboard(JSON.stringify(parseResult.entries, null, 2));
    message.success("已复制结构化条目 JSON");
  };

  return (
    <div className={styles.container}>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={mode}
        options={M3U_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(e) => setMode(e.target.value as M3uMode)}
      />

      {mode === M3uMode.PARSE ? (
        <div className={styles.panels}>
          <Card
            title="M3U / M3U8 输入"
            extra={
              <Button size="small" onClick={() => setParseText(DEFAULT_PARSE_INPUT)}>
                载入样例
              </Button>
            }
          >
            <Input.TextArea
              value={parseText}
              onChange={(e) => setParseText(e.target.value)}
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 16, maxRows: 28 }}
            />
          </Card>

          <Card title="解析结果" extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopyParse}>复制 JSON</Button>}>
            <div className={styles.stats}>
              <Tag color="blue">条目 {parseResult.entries.length}</Tag>
              <Tag color="purple">{parseResult.isHls ? "HLS 媒体列表" : "普通播放列表"}</Tag>
              <Tag color="green">总时长 {formatClock(parseResult.totalDuration)}</Tag>
              {parseResult.hls.version !== null && <Tag>VERSION {parseResult.hls.version}</Tag>}
              {parseResult.hls.targetDuration !== null && (
                <Tag>TARGETDURATION {parseResult.hls.targetDuration}s</Tag>
              )}
              {parseResult.hls.mediaSequence !== null && (
                <Tag>SEQUENCE {parseResult.hls.mediaSequence}</Tag>
              )}
              {parseResult.hls.playlistType && <Tag>{parseResult.hls.playlistType}</Tag>}
              {parseResult.hls.endlist && <Tag color="orange">ENDLIST</Tag>}
            </div>

            {parseResult.errors.length > 0 && (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message={`${parseResult.errors.length} 条格式问题`}
                description={parseResult.errors.map((error) => (
                  <div key={error} className={styles.errorText}>
                    {error}
                  </div>
                ))}
              />
            )}

            <Table
              style={{ marginTop: 12 }}
              size="small"
              rowKey="index"
              pagination={false}
              scroll={{ x: true, y: 360 }}
              dataSource={parseResult.entries}
              columns={[
                { title: "#", dataIndex: "index", key: "index", width: 56, render: (v: number) => v + 1 },
                {
                  title: "时长(s)",
                  dataIndex: "duration",
                  key: "duration",
                  width: 90,
                  render: (v: number | null) => (v === null ? "—" : v),
                },
                { title: "标题", dataIndex: "title", key: "title", width: 160, render: (v: string) => v || "—" },
                { title: "资源 URI", dataIndex: "uri", key: "uri", render: (v: string) => <code>{v}</code> },
                { title: "行", dataIndex: "line", key: "line", width: 60 },
              ]}
            />
            {parseResult.unknownTags.length > 0 && (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message={`保留 ${parseResult.unknownTags.length} 个未识别标签`}
                description={parseResult.unknownTags.map((tag) => (
                  <div key={`${tag.line}-${tag.raw}`}>
                    第 {tag.line} 行：<code>{tag.raw}</code>
                  </div>
                ))}
              />
            )}
          </Card>
        </div>
      ) : (
        <div className={styles.panels}>
          <Card
            title="条目编辑"
            extra={
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addRow}>
                新增条目
              </Button>
            }
          >
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              scroll={{ y: 320 }}
              dataSource={rows}
              columns={[
                {
                  title: "时长(s)",
                  dataIndex: "duration",
                  key: "duration",
                  width: 110,
                  render: (_: unknown, row: EditableRow) => (
                    <Input
                      size="small"
                      placeholder="可空"
                      defaultValue={row.duration === null ? "" : String(row.duration)}
                      onBlur={(e) =>
                        updateRow(row.key, {
                          duration: e.target.value.trim() === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  ),
                },
                {
                  title: "标题",
                  dataIndex: "title",
                  key: "title",
                  width: 160,
                  render: (_: unknown, row: EditableRow) => (
                    <Input size="small" defaultValue={row.title} onBlur={(e) => updateRow(row.key, { title: e.target.value })} />
                  ),
                },
                {
                  title: "资源 URI",
                  dataIndex: "uri",
                  key: "uri",
                  render: (_: unknown, row: EditableRow) => (
                    <Input size="small" defaultValue={row.uri} onBlur={(e) => updateRow(row.key, { uri: e.target.value })} />
                  ),
                },
                {
                  title: "",
                  key: "action",
                  width: 48,
                  render: (_: unknown, row: EditableRow) => (
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRow(row.key)} />
                  ),
                },
              ]}
            />

            <Card type="inner" size="small" title="HLS 参数（RFC 8216）" style={{ marginTop: 12 }}>
              <Checkbox checked={useHls} onChange={(e) => setUseHls(e.target.checked)}>
                输出 HLS 媒体播放列表（#EXT-X-*）
              </Checkbox>
              {useHls && (
                <div className={styles.row} style={{ marginTop: 12 }}>
                  <div className={styles.field}>
                    <span className={styles.label}>VERSION</span>
                    <Input size="small" style={{ width: 90 }} value={version} onChange={(e) => setVersion(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.label}>TARGETDURATION(s)</span>
                    <Input size="small" style={{ width: 130 }} value={targetDuration} onChange={(e) => setTargetDuration(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.label}>MEDIA-SEQUENCE</span>
                    <Input size="small" style={{ width: 120 }} value={mediaSequence} onChange={(e) => setMediaSequence(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.label}>PLAYLIST-TYPE</span>
                    <Select
                      size="small"
                      style={{ width: 110 }}
                      value={playlistType}
                      onChange={setPlaylistType}
                      options={[
                        { value: "VOD", label: "VOD" },
                        { value: "EVENT", label: "EVENT" },
                      ]}
                    />
                  </div>
                  <Checkbox checked={endlist} onChange={(e) => setEndlist(e.target.checked)}>
                    追加 #EXT-X-ENDLIST
                  </Checkbox>
                </div>
              )}
            </Card>
          </Card>

          <Card
            title="生成的播放列表文本"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  copyToClipboard(generatedText);
                  message.success("已复制播放列表文本");
                }}
              >
                复制
              </Button>
            }
          >
            <Input.TextArea
              value={generatedText}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 20, maxRows: 30 }}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

function toNonNegInt(text: string): number | null {
  const value = Number(text.trim());
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function seedRows(text: string): EditableRow[] {
  const parsed = parsePlaylist(text);
  if (parsed.entries.length > 0) {
    return parsed.entries.map((entry, i) => ({
      key: `seed-${i}`,
      duration: entry.duration,
      title: entry.title,
      uri: entry.uri,
    }));
  }
  return [{ key: "seed-empty", duration: null, title: "", uri: "" }];
}

export default M3uPlaylistParser;
