'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { diffJson, parseJson, type JsonDiffEntry, type JsonDiffType } from './utils/jsonDiff';
import styles from './index.module.css';

/** 示例左侧 JSON */
const SAMPLE_LEFT = `{
  "id": 1001,
  "name": "ToolCraft",
  "active": true,
  "owner": {
    "name": "张三",
    "age": 28
  },
  "tags": ["json", "diff", "local"],
  "version": 1
}`;

/** 示例右侧 JSON（包含新增、删除、修改与类型变化） */
const SAMPLE_RIGHT = `{
  "id": 1001,
  "name": "ToolCraft Pro",
  "active": "yes",
  "owner": {
    "name": "张三",
    "city": "上海"
  },
  "tags": ["json", "diff", "local", "secure"],
  "version": 2,
  "featured": false
}`;

/** 差异类型对应的标签颜色与中文文案 */
const TYPE_META: Record<JsonDiffType, { color: string; label: string }> = {
  added: { color: 'green', label: '新增' },
  removed: { color: 'red', label: '删除' },
  changed: { color: 'orange', label: '修改' },
  'type-changed': { color: 'purple', label: '类型变化' },
};

/** 差异结果表格列定义 */
const DIFF_COLUMNS: ColumnsType<JsonDiffEntry> = [
  {
    title: '路径',
    dataIndex: 'path',
    width: 260,
    render: (path: string) => <span className={styles.pathCell}>{path}</span>,
  },
  {
    title: '类型',
    dataIndex: 'type',
    width: 110,
    render: (type: JsonDiffType) => <Tag color={TYPE_META[type].color}>{TYPE_META[type].label}</Tag>,
  },
  {
    title: '左侧值',
    dataIndex: 'leftValue',
    render: (value: string) => <span className={styles.mono}>{value || '—'}</span>,
  },
  {
    title: '右侧值',
    dataIndex: 'rightValue',
    render: (value: string) => <span className={styles.mono}>{value || '—'}</span>,
  },
];

/**
 * JSON 结构化差异对比：输入左右两段 JSON 文本，实时解析并递归对比，
 * 输出 JSONPath 风格的路径级差异列表（新增 / 删除 / 修改 / 类型变化）。
 * 全部计算在浏览器本地完成，不发起任何网络请求。
 *
 * @returns JSON 差异对比交互界面
 */
const JsonDiff: React.FC<ToolComponentProps> = () => {
  const [leftText, setLeftText] = React.useState<string>(SAMPLE_LEFT);
  const [rightText, setRightText] = React.useState<string>(SAMPLE_RIGHT);

  const leftParse = React.useMemo(() => parseJson(leftText), [leftText]);
  const rightParse = React.useMemo(() => parseJson(rightText), [rightText]);

  const entries = React.useMemo<JsonDiffEntry[]>(() => {
    if (!leftParse.ok || !rightParse.ok) {
      return [];
    }
    return diffJson(leftParse.value, rightParse.value);
  }, [leftParse, rightParse]);

  const loadSample = (): void => {
    setLeftText(SAMPLE_LEFT);
    setRightText(SAMPLE_RIGHT);
    message.success('已载入示例 JSON');
  };

  const swapSides = (): void => {
    setLeftText(rightText);
    setRightText(leftText);
  };

  const copyResult = async (): Promise<void> => {
    if (entries.length === 0) {
      message.warning('暂无差异结果可复制');
      return;
    }
    const lines = entries.map(
      (entry) =>
        `${entry.path}\t${TYPE_META[entry.type].label}\t${entry.leftValue}\t${entry.rightValue}`,
    );
    await copyToClipboard(lines.join('\n'));
    message.success('差异结果已复制');
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="纯本地运行"
        description="两段 JSON 的解析与结构化对比全部在浏览器本地完成，不上传任何数据，不发起网络请求。"
      />

      <Card size="small">
        <Space wrap>
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadSample}>
            载入示例
          </Button>
          <Button icon={<SwapOutlined />} onClick={swapSides}>
            交换左右
          </Button>
          <Button icon={<CopyOutlined />} onClick={copyResult}>
            复制结果
          </Button>
        </Space>
        <div className={styles.hint} style={{ marginTop: 8 }}>
          编辑任意一侧文本后自动重新对比，差异路径采用 JSONPath 风格（如 $.user.name、$.items[0].id）。
        </div>
      </Card>

      <div className={styles.editors}>
        <Card
          size="small"
          className={styles.editorCard}
          title={
            <div className={styles.editorTitle}>
              <span>左侧 JSON</span>
              {!leftParse.ok ? <Tag color="red">解析失败</Tag> : <Tag color="green">合法</Tag>}
            </div>
          }
        >
          <Input.TextArea
            value={leftText}
            onChange={(event) => setLeftText(event.target.value)}
            autoSize={{ minRows: 12, maxRows: 22 }}
            spellCheck={false}
            className={styles.mono}
          />
        </Card>
        <Card
          size="small"
          className={styles.editorCard}
          title={
            <div className={styles.editorTitle}>
              <span>右侧 JSON</span>
              {!rightParse.ok ? <Tag color="red">解析失败</Tag> : <Tag color="green">合法</Tag>}
            </div>
          }
        >
          <Input.TextArea
            value={rightText}
            onChange={(event) => setRightText(event.target.value)}
            autoSize={{ minRows: 12, maxRows: 22 }}
            spellCheck={false}
            className={styles.mono}
          />
        </Card>
      </div>

      {!leftParse.ok ? (
        <Alert type="error" showIcon message="左侧 JSON 解析失败" description={leftParse.error} />
      ) : null}
      {!rightParse.ok ? (
        <Alert type="error" showIcon message="右侧 JSON 解析失败" description={rightParse.error} />
      ) : null}

      <Card
        title={`差异结果（${entries.length} 条）`}
        extra={
          <Tag color={entries.length === 0 ? 'green' : 'orange'}>
            {entries.length === 0 ? '完全一致' : '存在差异'}
          </Tag>
        }
      >
        {!leftParse.ok || !rightParse.ok ? (
          <Empty
            description="存在 JSON 解析失败，请修正后再查看差异"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : entries.length === 0 ? (
          <Empty description="两段 JSON 完全一致，没有差异" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table<JsonDiffEntry>
            rowKey="path"
            size="small"
            columns={DIFF_COLUMNS}
            dataSource={entries}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        )}
      </Card>
    </div>
  );
};

export default JsonDiff;
