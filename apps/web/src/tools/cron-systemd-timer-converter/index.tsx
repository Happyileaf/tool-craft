'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  ArrowRightOutlined,
  CopyOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  cronToOnCalendar,
  onCalendarToCron,
  compareNextRuns,
  getOnCalendarNextRuns,
  parseOnCalendar,
} from './utils/oncalendar';
import { parseCron, getCronNextRuns } from './utils/cron';
import {
  DEFAULT_CRON,
  CRON_EXAMPLES,
  ON_CALENDAR_EXAMPLES,
  RUN_PREVIEW_COUNT,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Direction = 'cron-to-oncalendar' | 'oncalendar-to-cron';

const pad2 = (n: number) => String(n).padStart(2, '0');

function formatRun(d: Date): string {
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()] ?? '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} 周${week} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

const CronSystemdTimerConverter: React.FC<ToolComponentProps> = ({
  defaultInput,
}) => {
  const [direction, setDirection] = React.useState<Direction>(
    'cron-to-oncalendar',
  );
  const [cronInput, setCronInput] = React.useState(defaultInput || DEFAULT_CRON);
  const [onCalInput, setOnCalInput] = React.useState('Mon..Fri *-*-* 09:00:00');

  const swap = () => {
    setDirection((d) =>
      d === 'cron-to-oncalendar'
        ? 'oncalendar-to-cron'
        : 'cron-to-oncalendar',
    );
  };

  const forward = React.useMemo(() => {
    try {
      if (direction === 'cron-to-oncalendar') {
        const r = cronToOnCalendar(cronInput);
        return { ok: true as const, output: r.expression, warnings: r.warnings, extras: r.alternatives };
      }
      const r = onCalendarToCron(onCalInput);
      return { ok: true as const, output: r.expression, warnings: r.warnings, extras: [] as string[] };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message, warnings: [], extras: [] };
    }
  }, [direction, cronInput, onCalInput]);

  // 反向转换后两侧表达式齐备，做触发对照
  const comparison = React.useMemo(() => {
    if (!forward.ok) return null;
    try {
      const cronExpr =
        direction === 'cron-to-oncalendar' ? cronInput.trim() : forward.output;
      const onCalExpr =
        direction === 'cron-to-oncalendar' ? forward.output : onCalInput.trim();
      // 语法预检
      parseCron(cronExpr);
      parseOnCalendar(onCalExpr);
      return compareNextRuns(
        cronExpr,
        onCalExpr,
        RUN_PREVIEW_COUNT,
        new Date(),
      );
    } catch {
      return null;
    }
  }, [forward, direction, cronInput, onCalInput]);

  const cronPreview = React.useMemo(() => {
    try {
      return getCronNextRuns(parseCron(cronInput), RUN_PREVIEW_COUNT, new Date());
    } catch {
      return [];
    }
  }, [cronInput]);

  const onCalPreview = React.useMemo(() => {
    try {
      return getOnCalendarNextRuns(onCalInput, RUN_PREVIEW_COUNT, new Date());
    } catch {
      return [];
    }
  }, [onCalInput]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const inputLabel =
    direction === 'cron-to-oncalendar' ? 'cron 表达式（分 时 日 月 周）' : 'OnCalendar 表达式';
  const outputLabel =
    direction === 'cron-to-oncalendar' ? 'systemd OnCalendar' : 'cron 表达式';

  return (
    <div className={styles.container}>
      <Space wrap>
        <Tag color="blue">
          {direction === 'cron-to-oncalendar' ? 'cron → OnCalendar' : 'OnCalendar → cron'}
        </Tag>
        <Button icon={<SwapOutlined />} onClick={swap}>
          切换转换方向
        </Button>
      </Space>

      {!forward.ok && (
        <Alert type="error" showIcon message="表达式解析失败" description={forward.error} />
      )}

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={inputLabel}
          extra={
            direction === 'cron-to-oncalendar' ? (
              <Space size={4} wrap>
                {CRON_EXAMPLES.map((ex) => (
                  <Button key={ex.cron} size="small" onClick={() => setCronInput(ex.cron)}>
                    {ex.label}
                  </Button>
                ))}
              </Space>
            ) : (
              <Space size={4} wrap>
                {ON_CALENDAR_EXAMPLES.map((ex) => (
                  <Button key={ex.expr} size="small" onClick={() => setOnCalInput(ex.expr)}>
                    {ex.label}
                  </Button>
                ))}
              </Space>
            )
          }
        >
          <Input
            className={styles.code}
            size="large"
            value={direction === 'cron-to-oncalendar' ? cronInput : onCalInput}
            onChange={(e) =>
              direction === 'cron-to-oncalendar'
                ? setCronInput(e.target.value)
                : setOnCalInput(e.target.value)
            }
            placeholder={direction === 'cron-to-oncalendar' ? '*/5 9-18 * * 1-5' : 'Mon..Fri *-*-* 09:00:00'}
            spellCheck={false}
          />
          <div className={styles.chipRow}>
            {(direction === 'cron-to-oncalendar' ? cronPreview : onCalPreview).map((d: Date, i: number) => (
              <Tag key={i}>{formatRun(d)}</Tag>
            ))}
          </div>
        </Card>

        <Card
          className={styles.card}
          title={
            <span>
              {outputLabel} <ArrowRightOutlined style={{ margin: '0 6px' }} />
            </span>
          }
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              disabled={!forward.ok}
              onClick={() => forward.ok && copy(forward.output)}
            >
              复制结果
            </Button>
          }
        >
          {forward.ok ? (
            <>
              <div className={styles.resultBox}>{forward.output}</div>
              {forward.extras.length > 0 && (
                <Alert
                  style={{ marginTop: 12 }}
                  type="info"
                  showIcon
                  message="等价拆分方案（日与星期同时受限时参考）"
                  description={forward.extras.map((e) => (
                    <div className={styles.code} key={e}>
                      {e}
                    </div>
                  ))}
                />
              )}
            </>
          ) : (
            <Alert type="warning" showIcon message="请先修正左侧表达式" />
          )}
        </Card>
      </div>

      {forward.warnings.map((w, i) => (
        <Alert key={i} type="warning" showIcon message={w} />
      ))}

      {comparison && (
        <Card
          className={styles.card}
          title={
            <span>
              触发时刻对照（未来 {RUN_PREVIEW_COUNT} 次，本地时区，分钟粒度）{' '}
              <span className={comparison.equivalent ? styles.match : styles.mismatch}>
                {comparison.equivalent ? '✓ 两侧完全一致' : '✗ 两侧不一致'}
              </span>
            </span>
          }
        >
          <Table
            size="small"
            pagination={false}
            rowKey="index"
            dataSource={comparison.cronRuns.map((d, i) => ({
              key: i,
              index: i + 1,
              cron: formatRun(d),
              onCalendar: comparison.onCalendarRuns[i]
                ? formatRun(comparison.onCalendarRuns[i] as Date)
                : '—',
              match:
                comparison.onCalendarRuns[i]?.getTime() === d.getTime(),
            }))}
            columns={[
              { title: '#', dataIndex: 'index', width: 60 },
              { title: 'cron 触发', dataIndex: 'cron' },
              { title: 'OnCalendar 触发', dataIndex: 'onCalendar' },
              {
                title: '一致',
                dataIndex: 'match',
                width: 80,
                render: (v: boolean) => (
                  <Tag color={v ? 'success' : 'error'}>{v ? '是' : '否'}</Tag>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default CronSystemdTimerConverter;
