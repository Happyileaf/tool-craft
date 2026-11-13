'use client';

import React from 'react';
import { Alert, Card, Input, InputNumber, Select, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_PARAMS,
  K_FACTOR_MAX,
  K_FACTOR_MIN,
  K_FACTOR_PRESETS,
  RATING_MAX,
  RATING_MIN,
  RESULT_OPTIONS,
  SEQUENCE_LIMIT,
} from './constants';
import {
  estimateWinsToTarget,
  expectedScore,
  parseSequence,
  simulateSequence,
  updateRating,
  validateEloInputs,
  type MatchResult,
  type SimulationRow,
} from './utils/elo';
import styles from './index.module.css';

/** 自定义 K 系数在 Select 中的占位值 */
const CUSTOM_K = 'custom';

/**
 * 期望得分百分比展示文本
 * @param expected - 期望得分，取值 0-1
 * @returns 保留两位小数的百分比文本
 */
function formatPercent(expected: number): string {
  return `${(expected * 100).toFixed(2)}%`;
}

/**
 * 评分变动标签：上涨红色、下跌绿色、持平灰色
 * @param delta - 评分变动值
 * @returns 带颜色的 Tag
 */
function DeltaTag({ delta }: { delta: number }) {
  if (delta > 0) {
    return <Tag color="red">+{delta}</Tag>;
  }
  if (delta < 0) {
    return <Tag color="green">{delta}</Tag>;
  }
  return <Tag>0</Tag>;
}

/**
 * 比赛结果标签：胜红、负绿、和灰
 * @param result - 比赛结果
 * @returns 带颜色的 Tag
 */
function ResultTag({ result }: { result: MatchResult }) {
  if (result === 'W') {
    return <Tag color="red">胜 W</Tag>;
  }
  if (result === 'L') {
    return <Tag color="green">负 L</Tag>;
  }
  return <Tag>和 D</Tag>;
}

/**
 * K 系数输入组合：预设 Select 加自定义 InputNumber
 * @param value - 当前 K 系数，null 表示未填写
 * @param onChange - 数值变化回调
 * @returns K 系数输入区
 */
function KFactorField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}): React.ReactElement {
  const isPreset = K_FACTOR_PRESETS.some((preset) => preset.value === value);
  return (
    <div className={styles.field}>
      <label>K 系数（{K_FACTOR_MIN}-{K_FACTOR_MAX}）</label>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          style={{ width: 168 }}
          value={isPreset ? value : CUSTOM_K}
          onChange={(next: number | string) => {
            if (next === CUSTOM_K) {
              return;
            }
            onChange(Number(next));
          }}
          options={[
            ...K_FACTOR_PRESETS.map((preset) => ({
              label: `${preset.label}（K=${preset.value}）`,
              value: preset.value,
            })),
            { label: '自定义', value: CUSTOM_K },
          ]}
        />
        <InputNumber
          style={{ flex: 1 }}
          min={K_FACTOR_MIN}
          max={K_FACTOR_MAX}
          step={1}
          value={value}
          onChange={(next) => onChange(next === null ? null : Number(next))}
        />
      </Space.Compact>
    </div>
  );
}

/**
 * Elo 等级分计算器：
 * 提供单场期望胜率与赛后评分、比赛序列逐场推演、目标评分连胜场数估算三个功能区，
 * 全部计算在浏览器本地完成，不发起任何网络请求。
 *
 * @returns Elo 等级分计算器界面
 */
const EloRatingCalculator: React.FC<ToolComponentProps> = () => {
  // 单场计算
  const [ratingA, setRatingA] = React.useState<number | null>(DEFAULT_PARAMS.ratingA);
  const [ratingB, setRatingB] = React.useState<number | null>(DEFAULT_PARAMS.ratingB);
  const [singleK, setSingleK] = React.useState<number | null>(DEFAULT_PARAMS.kFactor);

  // 序列推演
  const [startRating, setStartRating] = React.useState<number | null>(DEFAULT_PARAMS.ratingA);
  const [opponentRating, setOpponentRating] = React.useState<number | null>(DEFAULT_PARAMS.ratingB);
  const [sequenceK, setSequenceK] = React.useState<number | null>(DEFAULT_PARAMS.kFactor);
  const [sequenceText, setSequenceText] = React.useState<string>(DEFAULT_PARAMS.sequence);

  // 目标胜场估算
  const [targetStart, setTargetStart] = React.useState<number | null>(DEFAULT_PARAMS.ratingA);
  const [targetRating, setTargetRating] = React.useState<number | null>(DEFAULT_PARAMS.targetRating);
  const [targetOpponent, setTargetOpponent] = React.useState<number | null>(DEFAULT_PARAMS.ratingB);
  const [targetK, setTargetK] = React.useState<number | null>(DEFAULT_PARAMS.kFactor);

  const singleValidation = React.useMemo(
    () => validateEloInputs({ ratingA, ratingB, kFactor: singleK }),
    [ratingA, ratingB, singleK],
  );

  const singleOutcome = React.useMemo(() => {
    if (!singleValidation.valid || ratingA === null || ratingB === null || singleK === null) {
      return null;
    }
    const expected = expectedScore(ratingA, ratingB);
    const outcomes = RESULT_OPTIONS.map((option) => {
      const next = updateRating(ratingA, option.score, expected, singleK);
      return {
        key: option.value,
        label: option.label,
        next,
        delta: next - ratingA,
      };
    });
    return { expected, outcomes };
  }, [ratingA, ratingB, singleK, singleValidation.valid]);

  const sequenceValidation = React.useMemo(
    () =>
      validateEloInputs({
        ratingA: startRating,
        opponentRating,
        kFactor: sequenceK,
        sequence: sequenceText,
      }),
    [startRating, opponentRating, sequenceK, sequenceText],
  );

  const sequenceResult = React.useMemo(() => {
    if (
      !sequenceValidation.valid ||
      startRating === null ||
      opponentRating === null ||
      sequenceK === null
    ) {
      return null;
    }
    const sequence = parseSequence(sequenceText);
    return simulateSequence(startRating, sequenceK, sequence, opponentRating);
  }, [startRating, opponentRating, sequenceK, sequenceText, sequenceValidation.valid]);

  const targetValidation = React.useMemo(
    () =>
      validateEloInputs({
        ratingA: targetStart,
        targetRating,
        opponentRating: targetOpponent,
        kFactor: targetK,
      }),
    [targetStart, targetRating, targetOpponent, targetK],
  );

  const targetEstimate = React.useMemo(() => {
    if (
      !targetValidation.valid ||
      targetStart === null ||
      targetRating === null ||
      targetOpponent === null ||
      targetK === null
    ) {
      return null;
    }
    return estimateWinsToTarget(targetStart, targetRating, targetOpponent, targetK);
  }, [targetStart, targetRating, targetOpponent, targetK, targetValidation.valid]);

  const sequenceColumns: ColumnsType<SimulationRow> = [
    { title: '场次', dataIndex: 'index', key: 'index', width: 72 },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 96,
      render: (value: MatchResult) => <ResultTag result={value} />,
    },
    {
      title: '实际得分',
      dataIndex: 'score',
      key: 'score',
      width: 96,
      render: (value: number) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '期望得分',
      dataIndex: 'expected',
      key: 'expected',
      render: (value: number) => <span className={styles.mono}>{value.toFixed(4)}</span>,
    },
    {
      title: '赛前评分',
      dataIndex: 'ratingBefore',
      key: 'ratingBefore',
      render: (value: number) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '赛后评分',
      dataIndex: 'ratingAfter',
      key: 'ratingAfter',
      render: (value: number) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '变动',
      dataIndex: 'delta',
      key: 'delta',
      width: 96,
      render: (value: number) => <DeltaTag delta={value} />,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="单场计算：期望胜率与赛后评分">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>棋手 A 评分（{RATING_MIN}-{RATING_MAX}）</label>
            <InputNumber
              value={ratingA}
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setRatingA(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>棋手 B 评分（{RATING_MIN}-{RATING_MAX}）</label>
            <InputNumber
              value={ratingB}
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setRatingB(value === null ? null : Number(value))}
            />
          </div>
          <KFactorField value={singleK} onChange={setSingleK} />
        </div>

        {!singleValidation.valid ? (
          <Alert
            type="error"
            showIcon
            message="参数不合法"
            description={
              <ul className={styles.alertList}>
                {singleValidation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            }
          />
        ) : singleOutcome ? (
          <>
            <Space wrap className={styles.summary}>
              <Statistic title="棋手 A 期望胜率" value={formatPercent(singleOutcome.expected)} />
              <Statistic
                title="棋手 B 期望胜率"
                value={formatPercent(1 - singleOutcome.expected)}
              />
            </Space>
            <div className={styles.statsGrid}>
              {singleOutcome.outcomes.map((outcome) => (
                <Card key={outcome.key} size="small">
                  <Statistic
                    title={`棋手 A ${outcome.label}后评分`}
                    value={outcome.next}
                    suffix={<DeltaTag delta={outcome.delta} />}
                  />
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </Card>

      <Card title="序列推演：逐场评分变化">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>起始评分（{RATING_MIN}-{RATING_MAX}）</label>
            <InputNumber
              value={startRating}
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setStartRating(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>固定对手评分（{RATING_MIN}-{RATING_MAX}）</label>
            <InputNumber
              value={opponentRating}
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setOpponentRating(value === null ? null : Number(value))}
            />
          </div>
          <KFactorField value={sequenceK} onChange={setSequenceK} />
        </div>

        <div className={styles.field} style={{ marginBottom: 12 }}>
          <label>比赛序列（W/D/L，逗号或空白分隔，最多 {SEQUENCE_LIMIT} 场）</label>
          <Input.TextArea
            value={sequenceText}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSequenceText(event.target.value)
            }
            spellCheck={false}
            autoSize={{ minRows: 2, maxRows: 8 }}
            placeholder="例如：W,D,W,L,D,W；也接受 1/0.5/0 词法"
          />
          <p className={styles.hint}>W = 胜（1 分），D = 和（0.5 分），L = 负（0 分），大小写不敏感。</p>
        </div>

        {!sequenceValidation.valid ? (
          <Alert
            type="error"
            showIcon
            message="序列或参数不合法"
            description={
              <ul className={styles.alertList}>
                {sequenceValidation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            }
          />
        ) : sequenceResult ? (
          <>
            <Space wrap className={styles.summary}>
              <Statistic title="起始评分" value={startRating ?? 0} />
              <Statistic title="最终评分" value={sequenceResult.finalRating} />
              <Statistic
                title="总变动"
                value={sequenceResult.totalDelta > 0 ? `+${sequenceResult.totalDelta}` : sequenceResult.totalDelta}
                valueStyle={
                  sequenceResult.totalDelta > 0
                    ? { color: '#cf1322' }
                    : sequenceResult.totalDelta < 0
                      ? { color: '#389e0d' }
                      : undefined
                }
              />
              <Tag color="geekblue">共 {sequenceResult.rows.length} 场</Tag>
            </Space>
            <Table<SimulationRow>
              rowKey="index"
              columns={sequenceColumns}
              dataSource={sequenceResult.rows}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              size="small"
              scroll={{ x: 760 }}
            />
          </>
        ) : null}
      </Card>

      <Card title="目标胜场估算：需要连胜多少场">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>当前评分（{RATING_MIN}-{RATING_MAX}）</label>
            <InputNumber
              value={targetStart}
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setTargetStart(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>目标评分（{RATING_MIN}-{RATING_MAX}）</label>
            <InputNumber
              value={targetRating}
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setTargetRating(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>固定对手评分（{RATING_MIN}-{RATING_MAX}）</label>
            <InputNumber
              value={targetOpponent}
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setTargetOpponent(value === null ? null : Number(value))}
            />
          </div>
          <KFactorField value={targetK} onChange={setTargetK} />
        </div>

        {!targetValidation.valid ? (
          <Alert
            type="error"
            showIcon
            message="参数不合法"
            description={
              <ul className={styles.alertList}>
                {targetValidation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            }
          />
        ) : targetEstimate ? (
          targetEstimate.feasible ? (
            <Space wrap className={styles.summary}>
              <Statistic title="所需连胜场数" value={targetEstimate.wins} suffix="场" />
              <Tag color={targetEstimate.wins === 0 ? 'default' : 'red'}>
                {targetEstimate.wins === 0 ? '目标评分不高于当前评分，无需连胜' : '假设每场都胜（score = 1）'}
              </Tag>
            </Space>
          ) : (
            <Alert type="warning" showIcon message="目标不可行" description={targetEstimate.reason} />
          )
        ) : null}
      </Card>

      <Alert
        type="info"
        showIcon
        message="Elo 公式说明"
        description={
          <div className={styles.hint}>
            <p>
              期望得分 Ea = 1 / (1 + 10^((Rb − Ra) / 400))，评分相差 400 分时弱方期望胜率约为 9.09%。
            </p>
            <p>
              赛后评分 R′ = R + K × (S − E)，其中 S 为实际得分（胜 1、和 0.5、负 0），更新结果四舍五入到整数；K
              系数越大，单场结果对评分的影响越强。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default EloRatingCalculator;
