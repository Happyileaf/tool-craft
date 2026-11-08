"use client";

import React from "react";
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { ToolComponentProps } from "../loaders";
import {
  COMMON_TIMEZONES,
  DEFAULT_WORK_END,
  DEFAULT_WORK_START,
  DAY_COUNT,
  WEEKDAY_ZH,
} from "./constants";
import {
  anchorDayStartUtc,
  buildDayGrid,
  findCommonSlots,
  formatOffset,
  mergeSlots,
  nextAnchorDays,
  offsetMinutes,
  pad2,
  toWallTime,
  type Participant,
} from "./utils/tz";
import styles from "./index.module.css";

interface UiParticipant extends Participant {
  key: string;
}

let seq = 0;
const nextKey = () => `p-${Date.now()}-${seq++}`;

const initialParticipants = (): UiParticipant[] =>
  COMMON_TIMEZONES.filter((z) => z.defaultSelected).map((z) => ({
    key: nextKey(),
    id: z.iana,
    label: z.label,
    timeZone: z.iana,
    workStart: DEFAULT_WORK_START,
    workEnd: DEFAULT_WORK_END,
  }));

const MultiTimezoneMeetingPlanner: React.FC<ToolComponentProps> = () => {
  // 锚定时区固定为浏览器本地时区，日期选择器选择该时区的某一天
  const anchorZone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };
  const [anchorDate, setAnchorDate] = React.useState<string>(todayStr);
  const [participants, setParticipants] = React.useState<UiParticipant[]>(initialParticipants);

  // 锚定日 UTC 午夜：把本地日期的 00:00 当作锚定时区墙上时间反推
  const dayStartUtc = React.useMemo(() => {
    const [y, m, d] = anchorDate.split("-").map(Number);
    const localMidnight = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 0, 0, 0).getTime();
    return anchorDayStartUtc(localMidnight, anchorZone);
  }, [anchorDate, anchorZone]);

  const matchSet = React.useMemo(() => {
    const slots = findCommonSlots(dayStartUtc, participants);
    return new Set(slots.map((s) => s.instant));
  }, [dayStartUtc, participants]);

  const weekRanges = React.useMemo(
    () =>
      nextAnchorDays(dayStartUtc, DAY_COUNT).map((day) => {
        const slots = findCommonSlots(day, participants);
        return {
          dayStartUtc: day,
          ranges: mergeSlots(slots, participants),
        };
      }),
    [dayStartUtc, participants],
  );

  const addParticipant = (iana: string) => {
    const tz = COMMON_TIMEZONES.find((t) => t.iana === iana);
    if (!tz) return;
    setParticipants((prev) => [
      ...prev,
      {
        key: nextKey(),
        id: iana,
        label: tz.label,
        timeZone: iana,
        workStart: DEFAULT_WORK_START,
        workEnd: DEFAULT_WORK_END,
      },
    ]);
  };

  const removeParticipant = (key: string) =>
    setParticipants((prev) => prev.filter((p) => p.key !== key));

  const updateWindow = (key: string, field: "workStart" | "workEnd", value: number | null) =>
    setParticipants((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value ?? 0 } : p)),
    );

  const usedZones = new Set(participants.map((p) => p.timeZone));

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message={`锚定时区：${anchorZone}（本地时区）。所有换算以 UTC 时间戳为真源，自动处理夏令时（DST）。`}
      />

      <Card
        className={styles.card}
        title="参会人与工作时间窗"
        extra={
          <Select
            style={{ width: 240 }}
            size="small"
            placeholder="添加时区"
            suffixIcon={<PlusOutlined />}
            value={null}
            onChange={(iana: string) => addParticipant(iana)}
            options={COMMON_TIMEZONES.filter((t) => !usedZones.has(t.iana)).map((t) => ({
              value: t.iana,
              label: `${t.label}（${t.iana}）`,
            }))}
          />
        }
      >
        {participants.map((p) => (
          <div className={styles.participantRow} key={p.key}>
            <div className={styles.participantMeta}>
              <Tag color="blue">{p.label}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {p.timeZone} · {formatOffset(offsetMinutes(Date.now(), p.timeZone))}
              </Typography.Text>
            </div>
            <Space size={4}>
              <InputNumber
                size="small"
                min={0}
                max={23}
                style={{ width: 64 }}
                addonBefore="起"
                value={p.workStart}
                onChange={(v) => updateWindow(p.key, "workStart", v)}
              />
              <InputNumber
                size="small"
                min={0}
                max={24}
                style={{ width: 64 }}
                addonBefore="止"
                value={p.workEnd}
                onChange={(v) => updateWindow(p.key, "workEnd", v)}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                本地小时（可跨午夜）
              </Typography.Text>
            </Space>
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeParticipant(p.key)}
            />
          </div>
        ))}
      </Card>

      <Card
        className={styles.card}
        title="24 小时热力网格"
        extra={
          <div className={styles.dayNav}>
            <input
              type="date"
              aria-label="选择锚定日期"
              value={anchorDate}
              onChange={(e) => e.target.value && setAnchorDate(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid rgba(0,0,0,0.15)",
              }}
            />
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <i className={styles.swatch} style={{ background: "#1677ff" }} />
                全员可开会
              </span>
              <span className={styles.legendItem}>
                <i className={styles.swatch} style={{ background: "#d6f2e0" }} />
                当地工作时间
              </span>
              <span className={styles.legendItem}>
                <i className={styles.swatch} style={{ background: "#f5f5f5" }} />
                非工作时间
              </span>
            </div>
          </div>
        }
      >
        {participants.length === 0 ? (
          <Alert type="warning" showIcon message="请先添加至少一个参会时区" />
        ) : (
          <div className={styles.gridWrap}>
            <table className={styles.grid}>
              <thead>
                <tr>
                  <th className={styles.zoneCell}>时区 / 锚定时区小时</th>
                  {Array.from({ length: 24 }, (_, h) => (
                    <th key={h} className={styles.hourHead}>
                      {pad2(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => {
                  const grid = buildDayGrid(dayStartUtc, p.timeZone, p.workStart, p.workEnd);
                  return (
                    <tr key={p.key}>
                      <td className={styles.zoneCell}>
                        <span className={styles.zoneLabel}>{p.label}</span>
                        <span className={styles.zoneOffset}>
                          {formatOffset(offsetMinutes(dayStartUtc, p.timeZone))}
                        </span>
                      </td>
                      {grid.cells.map((cell) => {
                        const isMatch = matchSet.has(cell.instant);
                        const cls = isMatch
                          ? styles.cellMatch
                          : cell.working
                            ? styles.cellWork
                            : styles.cellRest;
                        return (
                          <Tooltip
                            key={cell.instant}
                            title={`${p.timeZone} 当地 ${pad2(cell.hour)}:00（UTC ${new Date(
                              cell.instant,
                            ).toISOString().slice(11, 16)}）`}
                          >
                            <td className={`${styles.cell} ${cls}`}>{cell.hour}</td>
                          </Tooltip>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className={styles.card} title={`未来 ${DAY_COUNT} 天公共可开会时段（按小时合并）`}>
        <div className={styles.slotList}>
          {weekRanges.map(({ dayStartUtc: day, ranges }) => {
            const anchorWall = toWallTime(day, anchorZone);
            return (
              <div className={styles.slotCard} key={day}>
                <div className={styles.slotTitle}>
                  {anchorWall.year}-{pad2(anchorWall.month)}-{pad2(anchorWall.day)}（
                  {WEEKDAY_ZH[anchorWall.weekday] ?? anchorWall.weekday}）
                  {ranges.length === 0 && <Tag style={{ marginLeft: 8 }}>当日无重叠工作时段</Tag>}
                </div>
                {ranges.map((r) => (
                  <div key={r.startInstant}>
                    {participants.map((p) => (
                      <div className={styles.slotLine} key={p.key}>
                        <span>{p.label}</span>
                        <span>{r.labelByZone[p.timeZone] ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default MultiTimezoneMeetingPlanner;
