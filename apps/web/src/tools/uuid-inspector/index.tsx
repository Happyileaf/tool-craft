'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Tag, Tooltip } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { inspectBatch } from './utils/uuid-inspect';
import type { UuidInfo } from './utils/uuid-inspect';
import { DEFAULT_SAMPLE } from './constants';
import styles from './index.module.css';

const VERSION_TAG_COLORS: Record<string, string> = {
  '1': 'cyan',
  '2': 'geekblue',
  '3': 'purple',
  '4': 'blue',
  '5': 'purple',
  '6': 'cyan',
  '7': 'green',
  '8': 'orange',
  nil: 'default',
  max: 'magenta',
};

interface UuidResultItemProps {
  info: UuidInfo;
  index: number;
}

function UuidResultItem({ info, index }: UuidResultItemProps) {
  if (!info.valid) {
    return (
      <Card size="small" className={styles.resultItem}>
        <div className={styles.itemHeader}>
          <span className={styles.itemIndex}>#{index + 1}</span>
          <span className={styles.mono}>{info.input}</span>
          <Tag color="red">非法</Tag>
        </div>
        <Alert
          style={{ marginTop: 8 }}
          type="error"
          showIcon
          message={info.error ?? '格式不合法'}
        />
      </Card>
    );
  }

  const versionKey = String(info.version);
  const meta: Array<{ label: string; value: React.ReactNode }> = [];
  if (info.timestamp) {
    meta.push({
      label: '时间戳',
      value: info.timestampNote ? (
        <Tooltip title={info.timestampNote}>
          <span>{info.timestamp}（近似）</span>
        </Tooltip>
      ) : (
        info.timestamp
      ),
    });
  }
  if (info.node) {
    meta.push({ label: '节点（MAC）', value: <span className={styles.mono}>{info.node}</span> });
  }
  if (info.clockSeq !== null) {
    meta.push({ label: '时钟序列', value: info.clockSeq });
  }

  return (
    <Card size="small" className={styles.resultItem}>
      <div className={styles.itemHeader}>
        <span className={styles.itemIndex}>#{index + 1}</span>
        <span className={styles.mono}>{info.canonical}</span>
        {info.isDuplicate && <Tag color="orange">重复</Tag>}
      </div>
      <div className={styles.tagRow}>
        <Tag color={VERSION_TAG_COLORS[versionKey] ?? 'default'}>{info.versionLabel}</Tag>
        <Tag>{info.variantLabel}</Tag>
      </div>
      {meta.length > 0 && (
        <div className={styles.metaGrid}>
          {meta.map((entry) => (
            <div key={entry.label} className={styles.metaItem}>
              <span className={styles.metaLabel}>{entry.label}</span>
              <span className={styles.metaValue}>{entry.value}</span>
            </div>
          ))}
        </div>
      )}
      {info.warnings.length > 0 && (
        <Alert
          style={{ marginTop: 8 }}
          type="warning"
          showIcon
          message={info.warnings.join('；')}
        />
      )}
    </Card>
  );
}

/**
 * UUID 解析与校验工具，支持批量识别版本/变体、提取时间戳与节点信息、统计重复，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns UUID 解析交互界面
 */
const UuidInspector: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);

  const result = React.useMemo(() => inspectBatch(input), [input]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setInput(DEFAULT_SAMPLE)}
          >
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
        </Space>
      </div>

      <Card title="输入 UUID（每行一个，也可用逗号/分号/空格分隔）" className={styles.card}>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'每行一个 UUID，例如 550e8400-e29b-41d4-a716-446655440000'}
          rows={10}
          autoSize={{ minRows: 8, maxRows: 20 }}
        />
        <div className={styles.hint}>
          支持 8-4-4-4-12 标准形式，兼容大写、urn:uuid: 前缀与花括号包裹；解析完全在本地进行。
        </div>
      </Card>

      {result.summary.total > 0 && (
        <Card className={styles.card}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <Statistic title="片段总数" value={result.summary.total} />
            </div>
            <div className={styles.statItem}>
              <Statistic title="合法" value={result.summary.valid} valueStyle={{ color: '#3f8600' }} />
            </div>
            <div className={styles.statItem}>
              <Statistic
                title="非法"
                value={result.summary.invalid}
                valueStyle={{ color: result.summary.invalid > 0 ? '#cf1322' : undefined }}
              />
            </div>
            <div className={styles.statItem}>
              <Statistic title="去重后" value={result.summary.unique} />
            </div>
            <div className={styles.statItem}>
              <Statistic
                title="重复次数"
                value={result.summary.duplicate}
                valueStyle={{ color: result.summary.duplicate > 0 ? '#d46b08' : undefined }}
              />
            </div>
          </div>
        </Card>
      )}

      {result.items.length > 0 ? (
        <div className={styles.resultList}>
          {result.items.map((info, index) => (
            <UuidResultItem key={`${index}-${info.input}`} info={info} index={index} />
          ))}
        </div>
      ) : (
        <Card className={styles.card}>
          <Empty description="粘贴 UUID 后将在此显示解析结果" />
        </Card>
      )}
    </div>
  );
};

export default UuidInspector;
