'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Radio, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  describeSeconds,
  durationToSeconds,
  formatDuration,
  normalizeSeconds,
  parseDuration,
  type DurationComponents,
} from './utils/duration';
import { DEFAULT_DURATION, DEFAULT_SECONDS, DurationModeEnum, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 分量展示单元的元数据 */
const COMPONENT_CELLS: { key: keyof DurationComponents; label: string; unit: string }[] = [
  { key: 'years', label: '年', unit: 'Y' },
  { key: 'months', label: '月', unit: 'M' },
  { key: 'weeks', label: '周', unit: 'W' },
  { key: 'days', label: '日', unit: 'D' },
  { key: 'hours', label: '时', unit: 'H' },
  { key: 'minutes', label: '分', unit: 'M' },
  { key: 'seconds', label: '秒', unit: 'S' },
];

/**
 * ISO 8601 时长解析与格式化工具：解析 P1Y2M3DT4H5M6S、PT90M、P2W 等
 * 标准时长字符串为单位明细与总秒数，也可把任意秒数反向格式化。
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns ISO 8601 时长转换交互界面
 */
const Iso8601Duration: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<DurationModeEnum>(DurationModeEnum.PARSE);
  const [durationInput, setDurationInput] = React.useState<string>(defaultInput || DEFAULT_DURATION);
  const [secondsInput, setSecondsInput] = React.useState<number | null>(DEFAULT_SECONDS);

  const isParse = mode === DurationModeEnum.PARSE;

  const parseResult = React.useMemo(() => {
    if (!durationInput.trim()) {
      return null;
    }
    return parseDuration(durationInput);
  }, [durationInput]);

  const formatResult = React.useMemo(() => {
    if (secondsInput === null || Number.isNaN(secondsInput) || !Number.isFinite(secondsInput)) {
      return null;
    }
    const normalized = normalizeSeconds(secondsInput);
    return {
      normalized,
      iso: formatDuration(normalized),
      text: describeSeconds(secondsInput),
    };
  }, [secondsInput]);

  /**
   * 复制 ISO 结果
   *
   * @param text - 待复制文本
   */
  const handleCopy = async (text: string) => {
    if (!text) {
      return;
    }
    await copyToClipboard(text);
    message.success('复制成功');
  };

  /**
   * 切换方向并恢复对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: DurationModeEnum) => {
    setMode(next);
    if (next === DurationModeEnum.PARSE) {
      setDurationInput(DEFAULT_DURATION);
    } else {
      setSecondsInput(DEFAULT_SECONDS);
    }
  };

  /** 解析模式当前可展示的分量 */
  const parsedValue = parseResult?.value ?? null;
  /** 格式化模式归一化后的分量 */
  const formattedComponents = formatResult?.normalized ?? null;
  const activeComponents: (DurationComponents & { sign?: 1 | -1 }) | null = isParse
    ? parsedValue
    : formattedComponents;

  return (
    <div className={styles.container}>
      <Card title="ISO 8601 时长解析与格式化（P1Y2M3DT4H5M6S / PT90M / P2W）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as DurationModeEnum)}
            options={MODE_OPTIONS}
          />
          <Space>
            {isParse ? (
              <>
                <Button icon={<ReloadOutlined />} onClick={() => setDurationInput(DEFAULT_DURATION)}>
                  载入示例
                </Button>
                <Button icon={<ClearOutlined />} onClick={() => setDurationInput('')}>
                  清空
                </Button>
              </>
            ) : (
              <Button icon={<ReloadOutlined />} onClick={() => setSecondsInput(DEFAULT_SECONDS)}>
                载入示例
              </Button>
            )}
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isParse ? 'ISO 时长：' : '总秒数：'}</span>
          {isParse ? (
            <Input
              className={styles.mono}
              style={{ flex: 1, minWidth: 240 }}
              value={durationInput}
              onChange={(event) => setDurationInput(event.target.value)}
              placeholder="PnYnMnDTnHnMnS，例如 PT1H30M、P2W、-P5D"
              spellCheck={false}
            />
          ) : (
            <InputNumber
              style={{ width: 240 }}
              value={secondsInput}
              onChange={(value) => setSecondsInput(value)}
              min={-1e15}
              max={1e15}
              step={60}
              precision={undefined}
              placeholder="输入秒数，可为负或小数"
            />
          )}
        </div>
      </Card>

      {isParse && durationInput.trim() && parseResult?.error ? (
        <Alert type="error" showIcon message="解析失败" description={parseResult.error} />
      ) : !isParse && formatResult === null ? (
        <Alert type="warning" showIcon message="请输入一个有限的秒数" />
      ) : activeComponents ? (
        <Card
          title={isParse ? '时长明细' : '归一化结果'}
          extra={
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() =>
                handleCopy(isParse ? durationInput.trim() : (formatResult?.iso ?? ''))
              }
            >
              复制 {isParse ? '输入' : 'ISO 时长'}
            </Button>
          }
        >
          {activeComponents.sign === -1 && (
            <Tag color="red" style={{ marginBottom: 12 }}>
              负时长
            </Tag>
          )}
          <div className={styles.grid}>
            {COMPONENT_CELLS.map((cell) => (
              <div className={styles.cell} key={cell.key}>
                <span className={styles.cellKey}>
                  {cell.label}（{cell.unit}）
                </span>
                <span className={styles.cellValue}>{String(activeComponents[cell.key])}</span>
              </div>
            ))}
          </div>

          {isParse && parsedValue ? (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>折算总秒数：</span>
              <span className={styles.totalValue}>
                {durationToSeconds(parsedValue).toLocaleString('en-US')}
              </span>
              <span className={styles.totalLabel}>秒</span>
            </div>
          ) : (
            formatResult && (
              <>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>ISO 8601：</span>
                  <span className={styles.totalValue}>{formatResult.iso}</span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>可读描述：</span>
                  <span className={styles.totalValue} style={{ fontSize: 16 }}>
                    {formatResult.text}
                  </span>
                </div>
              </>
            )
          )}

          <div className={styles.hint}>
            {isParse
              ? '总秒数按 365 天/年、30 天/月、7 天/周固定折算（实际历法中 2 月、闰年长度不固定，年 / 月无确定秒数）；周（W）按标准不得与其他分量混用；仅最后一个分量允许小数。'
              : '秒数按「日 → 时 → 分 → 秒」进位归一化，零时长输出 PT0S；年、月因长度可变不参与反向格式化。'}
          </div>
        </Card>
      ) : (
        <Alert type="info" showIcon message="输入内容后将在此展示时长明细" />
      )}
    </div>
  );
};

export default Iso8601Duration;
