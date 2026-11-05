'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Collapse, Empty, Input, Space, Statistic, Tag, message } from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  FileAddOutlined,
  FileOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  parsePatch,
  type ChangeType,
  type DiffLine,
  type FileChange,
  type Hunk,
} from './utils/patch';
import { CHANGE_TYPE_META, SAMPLE_PATCH } from './constants';
import styles from './index.module.css';

/**
 * 按行种类返回着色样式类名
 *
 * @param kind - hunk 行种类
 * @returns 对应的 CSS Module 类名
 */
function getLineClass(kind: DiffLine['kind']): string | undefined {
  switch (kind) {
    case 'add':
      return styles.lineAdd;
    case 'remove':
      return styles.lineRemove;
    case 'no-newline':
      return styles.lineNoNewline;
    default:
      return styles.lineContext;
  }
}

/**
 * 按行种类返回原始前缀符号
 *
 * @param kind - hunk 行种类
 * @returns + / - / 空格 / 反斜杠
 */
function getLinePrefix(kind: DiffLine['kind']): string {
  switch (kind) {
    case 'add':
      return '+';
    case 'remove':
      return '-';
    case 'no-newline':
      return '\\';
    default:
      return ' ';
  }
}

/**
 * 渲染单个 hunk：先展示 @@ 头，再逐行着色展示新增、删除与上下文。
 *
 * @param hunk - hunk 解析结果
 * @param hunkIndex - hunk 在文件内的序号
 * @returns hunk 视图节点
 */
function HunkBlock({ hunk, hunkIndex }: { hunk: Hunk; hunkIndex: number }): React.ReactElement {
  return (
    <div className={styles.hunkBlock}>
      <div className={styles.hunkHeader}>
        Hunk {hunkIndex + 1}
        <span className={styles.mono}>
          @@ -{hunk.oldRange.start},{hunk.oldRange.count} +{hunk.newRange.start},
          {hunk.newRange.count} @@{hunk.section ? ` ${hunk.section}` : ''}
        </span>
      </div>
      <pre className={styles.lineList}>
        {hunk.lines.map((line, index) => (
          <div key={`${line.sourceLine}-${index}`} className={`${styles.line} ${getLineClass(line.kind) ?? ''}`}>
            <span className={styles.gutter}>{line.oldLineNumber ?? ''}</span>
            <span className={styles.gutter}>{line.newLineNumber ?? ''}</span>
            <span className={styles.prefix}>{getLinePrefix(line.kind)}</span>
            <span className={styles.lineText}>{line.text}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

/**
 * 渲染文件折叠面板标题：路径、变更类型 Tag 与 +n -m 徽标。
 *
 * @param file - 文件变更解析结果
 * @returns 面板标题节点
 */
function FileHeader({ file }: { file: FileChange }): React.ReactElement {
  const meta = CHANGE_TYPE_META[file.type] ?? { label: '修改', color: 'blue' };
  const path = file.type === 'deleted' ? (file.oldPath ?? '(未知路径)') : (file.newPath ?? file.oldPath ?? '(未知路径)');
  return (
    <Space size={8} wrap>
      {file.type === 'added' ? <FileAddOutlined /> : <FileOutlined />}
      <span className={styles.filePath}>{path}</span>
      <Tag color={meta.color}>{meta.label}</Tag>
      {file.renameTo !== null && (
        <Tag color="orange" bordered={false}>
          {file.renameFrom} → {file.renameTo}
        </Tag>
      )}
      <span className={styles.badgeAdd}>+{file.additions}</span>
      <span className={styles.badgeDel}>-{file.deletions}</span>
      <span className={styles.hunkCount}>{file.hunks.length} hunk</span>
    </Space>
  );
}

/**
 * Unified Diff / Patch 解析与统计查看器：
 * 粘贴现成 patch 文本，逐行确定性解析文件头、hunk 与行级变更，
 * 输出顶部统计、按文件折叠的着色视图与带行号的畸形错误列表；全部计算在浏览器本地完成。
 *
 * @returns patch 解析器交互界面
 */
const DiffPatchParser: React.FC<ToolComponentProps> = () => {
  const [text, setText] = React.useState<string>(SAMPLE_PATCH);

  const parsed = React.useMemo(() => parsePatch(text), [text]);

  const copyResult = async (): Promise<void> => {
    if (parsed.files.length === 0) {
      message.warning('暂无可复制的解析结果');
      return;
    }
    await copyToClipboard(JSON.stringify(parsed, null, 2));
    message.success('解析结果 JSON 已复制');
  };

  const collapseItems = parsed.files.map((file, fileIndex) => ({
    key: `${file.headerLine}-${fileIndex}`,
    label: <FileHeader file={file} />,
    children: (
      <div>
        {file.headerMissing ? (
          <Alert
            type="warning"
            showIcon
            className={styles.fileAlert}
            message="该文件缺少 diff --git 头，路径与类型可能不准确"
          />
        ) : null}
        <Space size={4} wrap className={styles.metaRow}>
          {file.newFileMode !== null && <Tag color="green">new file mode {file.newFileMode}</Tag>}
          {file.deletedFileMode !== null && <Tag color="red">deleted file mode {file.deletedFileMode}</Tag>}
          {file.oldMode !== null && file.newMode !== null && (
            <Tag color="gold">
              mode {file.oldMode} → {file.newMode}
            </Tag>
          )}
          {file.similarity !== null && <Tag color="orange">similarity {file.similarity}%</Tag>}
          {file.indexLine !== null && <Tag className={styles.mono}>{file.indexLine}</Tag>}
        </Space>
        {file.hunks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="该文件没有可展示的 hunk"
            className={styles.emptyBlock}
          />
        ) : (
          file.hunks.map((hunk, hunkIndex) => (
            <HunkBlock key={`${hunk.headerLine}-${hunkIndex}`} hunk={hunk} hunkIndex={hunkIndex} />
          ))
        )}
      </div>
    ),
  }));

  return (
    <div className={styles.container}>
      <Card
        title="Unified Diff / Patch 输入"
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => setText(SAMPLE_PATCH)}>
              载入示例
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>
              清空
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<CopyOutlined />}
              onClick={copyResult}
              disabled={parsed.files.length === 0}
            >
              复制 JSON
            </Button>
          </Space>
        }
      >
        <p className={styles.hint}>
          仅解析现成的 unified diff / git patch 文本（不做两段文本比对）。支持 diff --git、new/deleted file
          mode、rename/copy、权限与相似度 index、多 hunk 及 No newline 标记；畸形内容按行号报告且不中断解析。
        </p>
        <Input.TextArea
          className={styles.mono}
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoSize={{ minRows: 8, maxRows: 22 }}
          spellCheck={false}
          placeholder={'粘贴 git diff / patch，如：\ndiff --git a/f b/f\n--- a/f\n+++ b/f\n@@ -1 +1 @@\n-old\n+new'}
        />
      </Card>

      <Card title="统计汇总">
        <div className={styles.statGrid}>
          <Statistic title="变更文件数" value={parsed.fileCount} />
          <Statistic title="新增行" value={parsed.totalAdditions} valueStyle={{ color: '#389e0d' }} />
          <Statistic title="删除行" value={parsed.totalDeletions} valueStyle={{ color: '#cf1322' }} />
          <Statistic title="Hunk 数" value={parsed.hunkCount} />
          <Statistic
            title="错误数"
            value={parsed.errors.length}
            valueStyle={parsed.errors.length > 0 ? { color: '#cf1322' } : undefined}
          />
        </div>
      </Card>

      {parsed.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={`检测到 ${parsed.errors.length} 处畸形内容（解析未中断）`}
          description={
            <ul className={styles.errorList}>
              {parsed.errors.map((error, index) => (
                <li key={`${error.line}-${index}`}>
                  <Tag color="red">第 {error.line} 行</Tag>
                  {error.message}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card title="文件视图">
        {collapseItems.length === 0 ? (
          <Empty description="粘贴 patch 后在此查看解析结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Collapse items={collapseItems} defaultActiveKey={collapseItems[0]?.key} />
        )}
      </Card>
    </div>
  );
};

export default DiffPatchParser;
