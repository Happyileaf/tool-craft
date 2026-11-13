'use client';

import React from 'react';
import { Alert, Button, Card, Input, InputNumber, Radio, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_INITIAL_RATING,
  DEFAULT_K_FACTOR,
  K_FACTOR_PRESETS,
  MATCH_TEXTAREA_PLACEHOLDER,
  SAMPLE_MATCH_TEXT,
} from './constants';
import {
  SCORE_DRAW,
  SCORE_LOSS,
  SCORE_WIN,
  expectedScore,
  parseMatchText,
  simulateSeries,
  validateInputs,
  type MatchStep,
} from './utils/elo';
import styles from './index.module.css';

/** 单场对战表单状态 */
interface SingleForm {
  opponent: number | null;
  score: number;
}

/** 明细表行（带 Table 需要的 key） */
interface SeriesRow extends MatchStep {
  key: number;
}

const SCORE_OPTIONS = [
  { label: '胜（1）', value: SCORE_WIN },
  { label: '平（0.5）', value: SCORE_DRAW },
  { label: '负（0）', value: SCORE_LOSS },
];

/** 结果标签颜色与文案 */
function scoreTag(score: number): React.ReactNode {
  if (score === SCORE_WIN) {
    return <Tag color="success">胜</Tag>;
  }
  if (score === SCORE_DRAW) {
    return <Tag color="default">平</Tag>;
  }
  return <Tag color="error">负</Tag>;
}

/** 变化量着色：正绿负红零灰 */
function deltaText(delta: number): React.ReactNode {
  const color = delta > 0 ? '#389e0d' : delta < 0 ? '#cf1322' : 'rgba(0,0,0,0.45)';
  const sign = delta > 0 ? '+' : '';
  return <span style={{ color, fontFamily: 'ui-monospace, monospace' }}>{`${sign}${delta}`}</span>;
}

const SERIES_COLUMNS: ColumnsType<SeriesRow> = [
  { title: '#', dataIndex: 'index', key: 'index', width: 56 },
  {
    title: '对手分',
    dataIndex: 'opponentRating',
    key: 'opponentRating',
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: '结果',
    dataIndex: 'score',
    key: 'score',
    render: (value: number) => scoreTag(value),
  },
  {
    title: '赛前分',
    dataIndex: 'ratingBefore',
    key: 'ratingBefore',
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: '期望胜率',
    dataIndex: 'expected',
    key: 'expected',
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: '变化',
    dataIndex: 'delta',
    key: 'delta',
    render: (value: number) => deltaText(value),
  },
  {
    title: '赛后分',
    dataIndex: 'ratingAfter',
    key: 'ratingAfter',
    render: (value: number) => <strong className={styles.mono}>{value}</strong>,
  },
];

/**
 * Elo 等级分计算器：单场对战演算与批量序列推演，全部运算在浏览器本地完成
 *
 * @returns Elo 评分交互界面
 */
const EloRatingCalculator: React.FC<ToolComponentProps> = () => {
  const [initialRating, setInitialRating] = React.useState<number | null>(DEFAULT_INITIAL_RATING);
  const [kFactor, setKFactor] = React.useState<number | null>(DEFAULT_K_FACTOR);
  const [single, setSingle] = React.useState<SingleForm>({ opponent: 1500, score: SCORE_WIN });
  const [matchText, setMatchText] = React.useState<string>('');
  const [seriesError, setSeriesError] = React.useState<string | null>(null);

  const ratingValue = initialRating ?? 0;
  const kValue = kFactor ?? 0;
  const inputError = validateInputs(ratingValue, kValue);

  /** 单场对战结果 */
  const singleResult = React.useMemo(() => {
    if (inputError !== null || single.opponent === null || !Number.isFinite(single.opponent)) {
      return null;
    }
    if (single.opponent < 0 || single.opponent > 10000) {
      return null;
    }
    const expected = expectedScore(ratingValue, single.opponent);
    const delta = kValue * (single.score - expected);
    return {
      expected,
      delta,
      next: Math.round((ratingValue + delta + Number.EPSILON) * 100) / 100,
    };
  }, [inputError, single, ratingValue, kValue]);

  /** 批量序列推演结果：解析失败时记为 null 并由 effect 同步错误提示 */
  const series = React.useMemo(() => {
    if (inputError !== null || matchText.trim() === '') {
      return null;
    }
    try {
      const matches = parseMatchText(matchText);
      return simulateSeries(ratingValue, kValue, matches);
    } catch {
      return null;
    }
  }, [matchText, ratingValue, kValue, inputError]);

  /** 将批量文本的解析错误同步到提示态，避免在渲染阶段更新 state */
  React.useEffect(() => {
    if (inputError !== null || matchText.trim() === '') {
      setSeriesError(null);
      return;
    }
    try {
      parseMatchText(matchText);
      setSeriesError(null);
    } catch (error) {
      setSeriesError(error instanceof Error ? error.message : '对局文本解析失败');
    }
  }, [matchText, inputError]);

  const rows: SeriesRow[] = React.useMemo(
    () => (series ? series.steps.map((step) => ({ ...step, key: step.index })) : []),
    [series],
  );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">Elo 评分</Tag>
        <span className={styles.hint}>
          公式 E = 1 / (1 + 10^((R对手 − R自己) / 400))，赛后分 = R + K × (S − E)，全程本地运算
        </span>
      </div>

      <Card className={styles.card} title="基础参数" size="small">
        <div className={styles.options}>
          <span className={styles.option}>
            <span className={styles.label}>当前等级分</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0}
              max={10000}
              step={10}
              value={initialRating}
              onChange={setInitialRating}
            />
          </span>
          <span className={styles.option}>
            <span className={styles.label}>K 因子</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={1}
              max={200}
              step={1}
              value={kFactor}
              onChange={setKFactor}
            />
          </span>
        </div>
        <div className={styles.presets}>
          {K_FACTOR_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              size="small"
              type={kFactor === preset.value ? 'primary' : 'default'}
              onClick={() => setKFactor(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        {inputError !== null ? (
          <Alert className={styles.notice} type="error" showIcon message={inputError} />
        ) : null}
      </Card>

      <Card className={styles.card} title="单场对战演算" size="small">
        <div className={styles.options}>
          <span className={styles.option}>
            <span className={styles.label}>对手等级分</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0}
              max={10000}
              step={10}
              value={single.opponent}
              onChange={(value) => setSingle((prev) => ({ ...prev, opponent: value }))}
            />
          </span>
          <span className={styles.option}>
            <span className={styles.label}>对战结果</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={SCORE_OPTIONS}
              value={single.score}
              onChange={(event) => setSingle((prev) => ({ ...prev, score: event.target.value }))}
            />
          </span>
        </div>
        {singleResult ? (
          <div className={styles.stats}>
            <Statistic
              title="期望胜率"
              value={singleResult.expected}
              precision={4}
              valueStyle={{ color: '#1677ff' }}
            />
            <Statistic
              title="本场变化"
              value={singleResult.delta}
              precision={2}
              valueStyle={{
                color: singleResult.delta >= 0 ? '#389e0d' : '#cf1322',
              }}
              formatter={(value) => `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}`}
            />
            <Statistic title="赛后等级分" value={singleResult.next} precision={2} />
          </div>
        ) : (
          <Alert
            className={styles.notice}
            type="info"
            showIcon
            message="请填写合法的当前等级分、K 因子与对手等级分"
          />
        )}
      </Card>

      <Card
        className={styles.card}
        title="批量对局序列推演"
        size="small"
        extra={
          <Button size="small" onClick={() => setMatchText(SAMPLE_MATCH_TEXT)}>
            填充示例
          </Button>
        }
      >
        <Input.TextArea
          rows={6}
          value={matchText}
          onChange={(event) => setMatchText(event.target.value)}
          placeholder={MATCH_TEXTAREA_PLACEHOLDER}
          className={styles.textarea}
        />
        {seriesError !== null ? (
          <Alert className={styles.notice} type="error" showIcon message={seriesError} />
        ) : null}
        {series ? (
          <>
            <div className={styles.stats}>
              <Statistic title="对局数" value={series.steps.length} />
              <Statistic
                title="累计变化"
                value={series.totalDelta}
                precision={2}
                valueStyle={{ color: series.totalDelta >= 0 ? '#389e0d' : '#cf1322' }}
                formatter={(value) =>
                  `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}`
                }
              />
              <Statistic title="最终等级分" value={series.finalRating} precision={2} />
            </div>
            <Table<SeriesRow>
              className={styles.table}
              columns={SERIES_COLUMNS}
              dataSource={rows}
              pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
              size="small"
              scroll={{ x: 640 }}
            />
          </>
        ) : null}
      </Card>
    </div>
  );
};

export default EloRatingCalculator;
