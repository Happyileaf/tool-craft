'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, DownloadOutlined, RedoOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  buildCombinedCalendar,
  buildVJournal,
  buildVTodo,
  type IcsResult,
  type RRuleSpec,
  type VTodoData,
  type VJournalData,
} from './utils/ical-todo-journal';
import {
  JOURNAL_STATUS_OPTIONS,
  RRULE_FREQ_OPTIONS,
  SAMPLE_JOURNAL,
  SAMPLE_TODO,
  TODO_STATUS_OPTIONS,
  createEmptyJournal,
  createEmptyTodo,
} from './constants';
import styles from './index.module.css';

/** 预览卡片：展示 ICS、错误与复制/下载操作 */
const PreviewCard: React.FC<{ result: IcsResult; fileName: string }> = ({ result, fileName }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = async () => {
    if (!result.ok) {
      return;
    }
    await copyToClipboard(result.ics);
    messageApi.success('ICS 文本已复制');
  };

  const handleDownload = () => {
    if (!result.ok) {
      return;
    }
    const blob = new Blob([result.ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    messageApi.success(`${fileName} 已开始下载`);
  };

  return (
    <Card title="ICS 预览（RFC 5545，CRLF + 75 八位组折行）">
      {contextHolder}
      {result.ok ? (
        <pre className={styles.preview}>{result.ics}</pre>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="修正表单错误后生成预览" />
      )}
      {!result.ok && <Alert className={styles.errorBox} type="warning" showIcon message={result.error} />}
      <div className={styles.actions} style={{ marginTop: 12 }}>
        <Button type="primary" icon={<CopyOutlined />} disabled={!result.ok} onClick={handleCopy}>
          复制 ICS
        </Button>
        <Button icon={<DownloadOutlined />} disabled={!result.ok} onClick={handleDownload}>
          下载 .ics
        </Button>
      </div>
      <p className={styles.hint} style={{ marginTop: 12 }}>
        输出统一使用 UTC 时间（Z 后缀），TEXT 值中的反斜杠、逗号、分号与换行自动转义；UID 与 DTSTAMP
        为 RFC 5545 必填字段，由工具在浏览器本地生成。可直接导入 Apple 提醒事项、Google Calendar 与 Outlook 任务。
      </p>
    </Card>
  );
};

/** VTODO 表单面板 */
const TodoPanel: React.FC = () => {
  const [data, setData] = React.useState<VTodoData>(createEmptyTodo);
  const patch = React.useCallback(
    <K extends keyof VTodoData>(key: K, value: VTodoData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );
  const result = React.useMemo(() => buildVTodo(data), [data]);

  return (
    <div className={styles.grid}>
      <Card
        title="VTODO 待办信息"
        extra={
          <Space>
            <Button size="small" onClick={() => setData(SAMPLE_TODO)}>
              填入样例
            </Button>
            <Button size="small" icon={<RedoOutlined />} onClick={() => setData(createEmptyTodo())}>
              清空
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <p className={styles.sectionTitle}>
              标题 SUMMARY <Tag color="red">必填</Tag>
            </p>
            <Input
              placeholder="如：提交季度合规报告"
              value={data.title}
              onChange={(event) => patch('title', event.target.value)}
            />
          </div>

          <Space.Compact block>
            <Input
              type="datetime-local"
              addonBefore="DTSTART"
              value={data.dtstart}
              onChange={(event) => patch('dtstart', event.target.value)}
            />
            <Input
              type="datetime-local"
              addonBefore="DUE"
              value={data.due}
              onChange={(event) => patch('due', event.target.value)}
            />
          </Space.Compact>

          <Space wrap style={{ display: 'flex' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p className={styles.sectionTitle}>STATUS</p>
              <Select
                style={{ width: '100%' }}
                value={data.status}
                options={TODO_STATUS_OPTIONS}
                onChange={(value) => patch('status', value)}
              />
            </div>
            <div style={{ width: 140 }}>
              <p className={styles.sectionTitle}>PRIORITY（1-9，留空省略）</p>
              <InputNumber
                min={1}
                max={9}
                precision={0}
                style={{ width: '100%' }}
                placeholder="如 1"
                value={data.priority}
                onChange={(value) => patch('priority', value === null ? null : Number(value))}
              />
            </div>
            <div style={{ width: 170 }}>
              <p className={styles.sectionTitle}>PERCENT-COMPLETE（0-100）</p>
              <InputNumber
                min={0}
                max={100}
                precision={0}
                style={{ width: '100%' }}
                placeholder="如 40"
                value={data.percentComplete}
                onChange={(value) => patch('percentComplete', value === null ? null : Number(value))}
              />
            </div>
          </Space>

          {data.status === 'COMPLETED' && (
            <div>
              <p className={styles.sectionTitle}>COMPLETED 完成时间（可选）</p>
              <Input
                type="datetime-local"
                style={{ width: '100%' }}
                value={data.completedAt}
                onChange={(event) => patch('completedAt', event.target.value)}
              />
            </div>
          )}

          <div>
            <p className={styles.sectionTitle}>
              RRULE 重复规则
              <Switch
                style={{ marginLeft: 8 }}
                checked={data.rrule !== null}
                onChange={(checked) =>
                  patch('rrule', checked ? { freq: 'WEEKLY', interval: 1 } : null)
                }
              />
            </p>
            {data.rrule !== null && (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space wrap>
                  <Select<RRuleSpec['freq']>
                    style={{ width: 180 }}
                    value={data.rrule.freq}
                    options={RRULE_FREQ_OPTIONS}
                    onChange={(freq) => patch('rrule', { ...(data.rrule as RRuleSpec), freq })}
                  />
                  <InputNumber
                    min={1}
                    precision={0}
                    addonBefore="INTERVAL"
                    style={{ width: 160 }}
                    value={data.rrule.interval ?? 1}
                    onChange={(value) =>
                      patch('rrule', { ...(data.rrule as RRuleSpec), interval: Number(value) || 1 })
                    }
                  />
                </Space>
                <Space wrap>
                  <InputNumber
                    min={1}
                    precision={0}
                    addonBefore="COUNT（与 UNTIL 二选一）"
                    style={{ width: 260 }}
                    placeholder="重复次数，留空不用"
                    value={data.rrule.count ?? null}
                    onChange={(value) =>
                      patch('rrule', {
                        ...(data.rrule as RRuleSpec),
                        count: value === null ? undefined : Number(value),
                        until: value === null ? data.rrule?.until : undefined,
                      })
                    }
                  />
                  <Input
                    type="datetime-local"
                    addonBefore="UNTIL"
                    style={{ width: 260 }}
                    value={data.rrule.until ?? ''}
                    onChange={(event) =>
                      patch('rrule', {
                        ...(data.rrule as RRuleSpec),
                        until: event.target.value || undefined,
                        count: event.target.value ? undefined : data.rrule?.count,
                      })
                    }
                  />
                </Space>
              </Space>
            )}
          </div>

          <Input
            addonBefore="CATEGORIES"
            placeholder="多个分类用英文逗号分隔，如：合规,季度任务"
            value={data.categories.join(',')}
            onChange={(event) =>
              patch(
                'categories',
                event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              )
            }
          />
          <Input
            addonBefore="RELATED-TO"
            placeholder="关联父组件 UID（可选）"
            value={data.relatedTo}
            onChange={(event) => patch('relatedTo', event.target.value)}
          />
          <Input.TextArea
            rows={3}
            placeholder="DESCRIPTION 描述（逗号、分号、反斜杠与换行会按 RFC 5545 自动转义）"
            value={data.description}
            onChange={(event) => patch('description', event.target.value)}
          />
        </Space>
      </Card>

      <PreviewCard result={result} fileName="todo.ics" />
    </div>
  );
};

/** VJOURNAL 表单面板 */
const JournalPanel: React.FC = () => {
  const [data, setData] = React.useState<VJournalData>(createEmptyJournal);
  const patch = React.useCallback(
    <K extends keyof VJournalData>(key: K, value: VJournalData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );
  const result = React.useMemo(() => buildVJournal(data), [data]);

  return (
    <div className={styles.grid}>
      <Card
        title="VJOURNAL 日记信息"
        extra={
          <Space>
            <Button size="small" onClick={() => setData(SAMPLE_JOURNAL)}>
              填入样例
            </Button>
            <Button size="small" icon={<RedoOutlined />} onClick={() => setData(createEmptyJournal())}>
              清空
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <p className={styles.sectionTitle}>
              标题 SUMMARY <Tag color="red">必填</Tag>
            </p>
            <Input
              placeholder="如：项目复盘日记"
              value={data.title}
              onChange={(event) => patch('title', event.target.value)}
            />
          </div>
          <div>
            <p className={styles.sectionTitle}>DTSTART 条目日期时间（VJOURNAL 可留空）</p>
            <Input
              type="datetime-local"
              style={{ width: '100%' }}
              value={data.dtstart}
              onChange={(event) => patch('dtstart', event.target.value)}
            />
          </div>
          <div>
            <p className={styles.sectionTitle}>STATUS（DRAFT / FINAL / CANCELLED）</p>
            <Select
              style={{ width: '100%' }}
              value={data.status}
              options={JOURNAL_STATUS_OPTIONS}
              onChange={(value) => patch('status', value)}
            />
          </div>
          <Input
            addonBefore="CATEGORIES"
            placeholder="多个分类用英文逗号分隔"
            value={data.categories.join(',')}
            onChange={(event) =>
              patch(
                'categories',
                event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              )
            }
          />
          <Input
            addonBefore="RELATED-TO"
            placeholder="关联组件 UID（可选）"
            value={data.relatedTo}
            onChange={(event) => patch('relatedTo', event.target.value)}
          />
          <Input.TextArea
            rows={4}
            placeholder="DESCRIPTION 日记正文（特殊字符自动转义）"
            value={data.description}
            onChange={(event) => patch('description', event.target.value)}
          />
        </Space>
      </Card>

      <PreviewCard result={result} fileName="journal.ics" />
    </div>
  );
};

/** 组合面板：把样例 VTODO 与 VJOURNAL 放入同一 VCALENDAR */
const CombinedPanel: React.FC = () => {
  const [todo, setTodo] = React.useState<VTodoData>(SAMPLE_TODO);
  const [journal, setJournal] = React.useState<VJournalData>(SAMPLE_JOURNAL);
  const result = React.useMemo(() => buildCombinedCalendar([todo], [journal]), [todo, journal]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="组合模式把一个 VTODO 与一个 VJOURNAL 组装进同一个 VCALENDAR（各组件自动分配独立 UID），可在下方快速切换样例字段后下载。"
      />
      <Space wrap>
        <Button onClick={() => setTodo(createEmptyTodo())}>清空待办标题以查看校验效果</Button>
        <Button onClick={() => setTodo(SAMPLE_TODO)}>恢复待办样例</Button>
        <Button onClick={() => setJournal(createEmptyJournal())}>清空日记标题以查看校验效果</Button>
        <Button onClick={() => setJournal(SAMPLE_JOURNAL)}>恢复日记样例</Button>
      </Space>
      <PreviewCard result={result} fileName="todo-journal.ics" />
    </Space>
  );
};

/**
 * iCalendar VTODO / VJOURNAL 生成器：表单 → RFC 5545 待办/日记组件，
 * 覆盖 STATUS/PRIORITY/PERCENT-COMPLETE/DUE/RRULE/RELATED-TO 等字段、
 * TEXT 转义、UTC 时间与 75 八位组折行，全部在浏览器本地完成。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const IcalTodoJournalGenerator: React.FC<ToolComponentProps> = (_props) => (
  <div className={styles.container}>
    <Card>
      <Tag color="blue">纯浏览器本地生成，依据 RFC 5545 Section 3.6.2 / 3.6.3，日历数据不上传</Tag>
      <Tabs
        style={{ marginTop: 12 }}
        items={[
          { key: 'todo', label: 'VTODO 待办', children: <TodoPanel /> },
          { key: 'journal', label: 'VJOURNAL 日记', children: <JournalPanel /> },
          { key: 'combined', label: '组合日历', children: <CombinedPanel /> },
        ]}
      />
    </Card>
  </div>
);

export default IcalTodoJournalGenerator;
