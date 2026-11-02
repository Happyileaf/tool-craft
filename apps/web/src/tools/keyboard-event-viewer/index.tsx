'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Input, Switch, Table, Tag } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import {
  filterKeyReference,
  formatKeyCombo,
  getLocationName,
  KEY_REFERENCE,
  snapshotKeyEvent,
  type KeyEventSnapshot,
  type KeyRow,
} from './utils/keyboard';
import { GROUP_ORDER, HISTORY_LIMIT, SNAPSHOT_FIELDS } from './constants';
import styles from './index.module.css';

/** 毫秒级时间格式化 HH:MM:SS.mmm */
function formatTime(time: number): string {
  const d = new Date(time);
  const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(
    d.getMilliseconds(),
    3,
  )}`;
}

const GROUP_COLORS: Record<string, string> = {
  字母: 'blue',
  数字: 'cyan',
  功能键: 'purple',
  控制键: 'orange',
  方向键: 'geekblue',
};

const KeyboardEventViewer: React.FC<ToolComponentProps> = () => {
  const [focused, setFocused] = React.useState(false);
  const [preventDefault, setPreventDefault] = React.useState(false);
  const [latest, setLatest] = React.useState<KeyEventSnapshot | null>(null);
  const [history, setHistory] = React.useState<KeyEventSnapshot[]>([]);
  const [query, setQuery] = React.useState('');
  const captureRef = React.useRef<HTMLDivElement>(null);

  const rows = React.useMemo(() => filterKeyReference(query), [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 开启后拦截默认行为（如 Tab 切焦、F1 帮助），避免区域内按键失效
    if (preventDefault) e.preventDefault();
    const snap = snapshotKeyEvent(e, Date.now());
    setLatest(snap);
    setHistory((prev) => [snap, ...prev].slice(0, HISTORY_LIMIT));
  };

  const latestView = latest
    ? { ...latest, locationName: getLocationName(latest.location) }
    : null;

  const referenceColumns = [
    {
      title: '分组',
      dataIndex: 'group',
      width: 100,
      render: (group: string) => <Tag color={GROUP_COLORS[group]}>{group}</Tag>,
    },
    { title: '按键', dataIndex: 'label', width: 120 },
    { title: 'keyCode', dataIndex: 'keyCode', width: 100 },
    { title: 'code', dataIndex: 'code' },
    { title: 'key', dataIndex: 'key', render: (key: string) => (key === ' ' ? '␠ (Space)' : key) },
  ];

  const historyColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      width: 130,
      render: (time: number) => <span className={styles.mono}>{formatTime(time)}</span>,
    },
    { title: '组合键', dataIndex: 'combo', render: (combo: string) => combo || '（修饰键）' },
    { title: 'code', dataIndex: 'code' },
    { title: 'keyCode', dataIndex: 'keyCode', width: 90 },
    {
      title: 'location',
      dataIndex: 'location',
      width: 110,
      render: (location: number) => getLocationName(location),
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="键盘事件实时监听"
        extra={
          <label className={styles.switchLabel}>
            <Switch checked={preventDefault} onChange={setPreventDefault} size="small" />
            <span>拦截默认行为（preventDefault）</span>
          </label>
        }
      >
        <div
          ref={captureRef}
          tabIndex={0}
          className={`${styles.captureArea} ${focused ? styles.captureFocused : ''}`}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          role="textbox"
          aria-label="键盘事件捕获区域，点击后按键"
        >
          {latestView ? (
            <div className={styles.result}>
              <div className={styles.comboRow}>
                <span className={styles.comboBig}>{latestView.combo || '（修饰键）'}</span>
                <Tag color={focused ? 'green' : 'default'}>
                  {focused ? '监听中' : '已失焦'}
                </Tag>
                {latestView.repeat ? <Tag color="red">repeat 重复触发</Tag> : null}
              </div>
              <div className={styles.fieldGrid}>
                {SNAPSHOT_FIELDS.map((field) => {
                  const value =
                    latestView[field.key as keyof typeof latestView];
                  return (
                    <div className={styles.fieldItem} key={field.key}>
                      <span className={styles.fieldLabel}>
                        {field.label}
                        {field.legacy ? <em className={styles.legacyTag}>legacy</em> : null}
                      </span>
                      <span className={styles.fieldValue}>
                        {typeof value === 'boolean' ? (
                          <Tag color={value ? 'green' : 'default'}>{value ? 'true' : 'false'}</Tag>
                        ) : (
                          String(value)
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>点击下方按钮或本区域获得焦点，然后按下任意键或组合键</p>
              <Button type="primary" onClick={() => captureRef.current?.focus()}>
                开始捕获
              </Button>
              <p className={styles.hint}>
                焦点在本区域内时才会捕获按键；默认不阻止浏览器行为，可在右上角开启
                preventDefault
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card
        title={`事件历史（最近 ${HISTORY_LIMIT} 条）`}
        size="small"
        extra={
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={() => setHistory([])}
            disabled={history.length === 0}
          >
            清空
          </Button>
        }
      >
        <Table<KeyEventSnapshot>
          columns={historyColumns}
          dataSource={history}
          rowKey={(_, index) => String(index)}
          size="small"
          pagination={false}
          scroll={{ y: 240 }}
          locale={{ emptyText: '暂无按键记录' }}
        />
      </Card>

      <Card
        title="按键码速查表"
        size="small"
        extra={
          <Input.Search
            allowClear
            placeholder="过滤按键名 / code / keyCode，如 Enter、KeyA、27"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            style={{ width: 320 }}
          />
        }
      >
        <Table<KeyRow>
          columns={referenceColumns}
          dataSource={rows}
          rowKey="code"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: '无匹配按键' }}
        />
        <p className={styles.hint}>
          keyCode / which 已从 Web 标准废弃，新代码请使用 <code>event.key</code> 与{' '}
          <code>event.code</code>；速查表共 {KEY_REFERENCE.length} 个常用按键，分组顺序：
          {GROUP_ORDER.join('、')}。组合键展示固定格式：
          {formatKeyCombo({ key: 'A', ctrlKey: true, shiftKey: true })}。
        </p>
      </Card>
    </div>
  );
};

export default KeyboardEventViewer;
