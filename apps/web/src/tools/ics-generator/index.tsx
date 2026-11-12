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
  Tag,
  message,
} from 'antd';
import { CopyOutlined, DownloadOutlined, RedoOutlined } from '@ant-design/icons';
import { buildIcsEvent, type IcsEventData } from './utils/ics';
import {
  REMINDER_PRESETS,
  REMINDER_UNIT_OPTIONS,
  SAMPLE_EVENT,
  TIMEZONE_OPTIONS,
  createEmptyEvent,
} from './constants';
import styles from './index.module.css';

/**
 * iCalendar (.ics) 单事件生成器：表单 → RFC 5545 VEVENT 文本，
 * 处理 TEXT 转义、UTC/TZID/全天三种时间形式、VALARM 提醒、75 八位组折行与 CRLF，
 * 支持复制与本地下载 .ics，全部运算在浏览器主线程完成。
 *
 * @returns iCalendar 事件生成交互界面
 */
const IcsGenerator: React.FC<ToolComponentProps> = () => {
  const [data, setData] = React.useState<IcsEventData>(createEmptyEvent);
  const [messageApi, contextHolder] = message.useMessage();

  const result = React.useMemo(() => buildIcsEvent(data), [data]);

  /** 浅量更新顶层字段 */
  const patch = React.useCallback(
    <K extends keyof IcsEventData>(key: K, value: IcsEventData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleCopy = async () => {
    if (!result.ok) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.ics);
      messageApi.success('ICS 文本已复制');
    } catch {
      messageApi.error('复制失败，请手动选择预览文本复制');
    }
  };

  const handleDownload = () => {
    if (!result.ok) {
      return;
    }
    const blob = new Blob([result.ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'event.ics';
    anchor.click();
    URL.revokeObjectURL(url);
    messageApi.success('event.ics 已开始下载');
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <div className={styles.grid}>
        <Card
          title="事件信息"
          extra={
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={() => setData(createEmptyEvent())}
            >
              清空
            </Button>
          }
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Button block onClick={() => setData(SAMPLE_EVENT)}>
              填入样例事件
            </Button>

            <div>
              <p className={styles.sectionTitle}>
                标题 SUMMARY <Tag color="red">必填</Tag>
              </p>
              <Input
                placeholder="如：v2.0 发版评审会"
                value={data.title}
                onChange={(event) => patch('title', event.target.value)}
              />
            </div>

            <div>
              <p className={styles.sectionTitle}>
                全天事件
                <Switch
                  style={{ marginLeft: 8 }}
                  checked={data.allDay}
                  onChange={(checked) => patch('allDay', checked)}
                />
              </p>
              <Space.Compact block>
                <Input
                  type={data.allDay ? 'date' : 'datetime-local'}
                  addonBefore="开始"
                  value={data.start}
                  onChange={(event) => patch('start', event.target.value)}
                />
                <Input
                  type={data.allDay ? 'date' : 'datetime-local'}
                  addonBefore="结束"
                  value={data.end}
                  onChange={(event) => patch('end', event.target.value)}
                />
              </Space.Compact>
            </div>

            {!data.allDay && (
              <div>
                <p className={styles.sectionTitle}>时区（留空按 UTC 输出）</p>
                <Select
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择 IANA 时区"
                  value={data.timezone}
                  options={TIMEZONE_OPTIONS}
                  onChange={(value) => patch('timezone', value)}
                />
              </div>
            )}

            <Input
              addonBefore="地点"
              placeholder="LOCATION，如：总部 3 楼星河会议室"
              value={data.location}
              onChange={(event) => patch('location', event.target.value)}
            />

            <Input
              addonBefore="组织者邮箱"
              placeholder="ORGANIZER mailto，如 host@example.com"
              value={data.organizerEmail}
              onChange={(event) => patch('organizerEmail', event.target.value)}
            />

            <Input.TextArea
              rows={3}
              placeholder="描述 DESCRIPTION（逗号、分号、反斜杠与换行会按 RFC 5545 自动转义）"
              value={data.description}
              onChange={(event) => patch('description', event.target.value)}
            />

            <div>
              <p className={styles.sectionTitle}>
                提醒 VALARM
                <Switch
                  style={{ marginLeft: 8 }}
                  checked={data.reminder !== null}
                  onChange={(checked) =>
                    patch(
                      'reminder',
                      checked ? { amount: 15, unit: 'minutes' } : null,
                    )
                  }
                />
              </p>
              {data.reminder !== null && (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap>
                    {REMINDER_PRESETS.map((preset) => (
                      <Tag
                        key={preset.label}
                        color="blue"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          patch('reminder', {
                            amount: preset.amount,
                            unit: preset.unit,
                          })
                        }
                      >
                        {preset.label}
                      </Tag>
                    ))}
                  </Space>
                  <Space.Compact block>
                    <InputNumber
                      min={1}
                      precision={0}
                      style={{ width: '50%' }}
                      addonBefore="提前"
                      value={data.reminder.amount}
                      onChange={(value) =>
                        patch('reminder', {
                          amount: typeof value === 'number' ? value : 1,
                          unit: data.reminder?.unit ?? 'minutes',
                        })
                      }
                    />
                    <Select
                      style={{ width: '50%' }}
                      value={data.reminder.unit}
                      options={REMINDER_UNIT_OPTIONS}
                      onChange={(value) =>
                        patch('reminder', {
                          amount: data.reminder?.amount ?? 15,
                          unit: value,
                        })
                      }
                    />
                  </Space.Compact>
                </Space>
              )}
            </div>
          </Space>
        </Card>

        <Card title="ICS 预览">
          {result.ok ? (
            <pre className={styles.preview}>{result.ics}</pre>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="填写标题与合法时间后生成预览"
            />
          )}
          {!result.ok && (
            <Alert
              className={styles.errorBox}
              type="warning"
              showIcon
              message={result.error}
            />
          )}
          <div className={styles.actions} style={{ marginTop: 12 }}>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              disabled={!result.ok}
              onClick={handleCopy}
            >
              复制 ICS
            </Button>
            <Button
              icon={<DownloadOutlined />}
              disabled={!result.ok}
              onClick={handleDownload}
            >
              下载 .ics
            </Button>
          </div>
          <p className={styles.hint}>
            输出遵循 RFC 5545：行尾 CRLF，逻辑行按 75 个八位组折行（续行以空格开头，多字节字符不会被截断），
            文本中的 \ ; , 与换行已自动转义；全天事件使用 VALUE=DATE 且 DTEND 取排他性次日。全部内容仅在浏览器本地生成。
          </p>
        </Card>
      </div>
    </div>
  );
};

export default IcsGenerator;
