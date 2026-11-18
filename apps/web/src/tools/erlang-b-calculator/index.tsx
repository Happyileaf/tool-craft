'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, InputNumber, Table, Tabs, Tag } from 'antd';
import { EXAMPLE_LINES, EXAMPLE_TARGET, EXAMPLE_TRAFFIC, GOS_TARGETS } from './constants';
import {
  erlangBBlocking,
  formatBlocking,
  gradeOfServiceTable,
  requiredLines,
  sensitivityTable,
  supportedTraffic,
} from './utils/erlangB';
import styles from './index.module.css';

/** 把文本输入安全解析为数字 */
function useNumericField(initial: string): [string, (value: string) => void, number] {
  const [text, setText] = React.useState(initial);
  const numeric = Number(text);
  return [text, setText, numeric];
}

/**
 * Erlang B 中继线话务量计算器：阻塞概率正算、所需线数反算、可承载话务量反算，
 * 并提供灵敏度与服务等级查表。全部计算在浏览器本地同步完成。
 *
 * @returns 三标签页话务工程界面
 */
const ErlangBCalculator: React.FC<ToolComponentProps> = () => {
  const [linesText, setLinesText, linesNumber] = useNumericField(EXAMPLE_LINES);
  const [trafficText, setTrafficText, trafficNumber] = useNumericField(EXAMPLE_TRAFFIC);
  const [targetText, setTargetText, targetNumber] = useNumericField(EXAMPLE_TARGET);

  // Tab 1：正算阻塞概率
  const blockingView = React.useMemo(() => {
    if (linesText.trim() === '' || trafficText.trim() === '') {
      return { empty: true };
    }
    try {
      const blocking = erlangBBlocking(linesNumber, trafficNumber);
      return {
        blocking,
        sensitivity: sensitivityTable(Math.trunc(linesNumber), trafficNumber),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [linesText, trafficText, linesNumber, trafficNumber]);

  // Tab 2：反算所需线数
  const linesView = React.useMemo(() => {
    if (trafficText.trim() === '' || targetText.trim() === '') {
      return { empty: true };
    }
    try {
      const result = requiredLines(trafficNumber, targetNumber);
      return {
        ...result,
        gos: gradeOfServiceTable(trafficNumber, GOS_TARGETS),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [trafficText, targetText, trafficNumber, targetNumber]);

  // Tab 3：反算可承载话务量
  const trafficView = React.useMemo(() => {
    if (linesText.trim() === '' || targetText.trim() === '') {
      return { empty: true };
    }
    try {
      return supportedTraffic(linesNumber, targetNumber);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [linesText, targetText, linesNumber, targetNumber]);

  const blockingTab = (
    <div>
      <p className={styles.hint}>
        输入中继线数 N 与到达话务量 A（Erlang），按 Erlang B 递推公式计算呼叫到达时全忙、被清除的概率，
        并给出 N±2 的灵敏度对照。
      </p>
      <div className={styles.stack}>
        <div>
          <div className={styles.fieldLabel}>中继线数 N（≥1 的整数）</div>
          <InputNumber
            min={1}
            precision={0}
            value={linesText === '' ? null : linesNumber}
            onChange={(value) => setLinesText(value === null ? '' : String(value))}
            style={{ width: 220 }}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>到达话务量 A（Erlang）</div>
          <Input
            value={trafficText}
            onChange={(event) => setTrafficText(event.target.value.replace(/[^\d.]/g, ''))}
            style={{ width: 220 }}
          />
        </div>
      </div>
      {'error' in blockingView && blockingView.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={blockingView.error} />
      ) : null}
      {'blocking' in blockingView && blockingView.blocking !== undefined ? (
        <>
          <div className={styles.resultGrid}>
            <div className={styles.resultCard}>
              <div className={styles.resultName}>阻塞概率 B(N, A)</div>
              <div className={styles.resultValue}>{formatBlocking(blockingView.blocking)}</div>
              <div className={styles.resultSub}>原始值 {blockingView.blocking.toExponential(4)}</div>
            </div>
            <div className={styles.resultCard}>
              <div className={styles.resultName}>每 1000 次呼叫预期被阻塞次数</div>
              <div className={styles.resultValue}>{Math.round(blockingView.blocking * 1000)}</div>
            </div>
          </div>
          <Table
            style={{ marginTop: 16 }}
            size="small"
            pagination={false}
            rowKey="lines"
            dataSource={blockingView.sensitivity}
            columns={[
              { title: '中继线数', dataIndex: 'lines', key: 'lines' },
              {
                title: '相对变化',
                dataIndex: 'delta',
                key: 'delta',
                render: (delta: number) => (
                  <Tag color={delta === 0 ? 'blue' : delta < 0 ? 'red' : 'green'}>
                    {delta === 0 ? '当前' : delta > 0 ? `+${delta}` : String(delta)}
                  </Tag>
                ),
              },
              {
                title: '阻塞概率',
                dataIndex: 'blocking',
                key: 'blocking',
                render: (value: number) => formatBlocking(value),
              },
            ]}
          />
        </>
      ) : null}
    </div>
  );

  const linesTab = (
    <div>
      <p className={styles.hint}>给定话务量与目标服务等级（GoS，即可接受的阻塞概率），求最少需要多少条中继线。</p>
      <div className={styles.stack}>
        <div>
          <div className={styles.fieldLabel}>到达话务量 A（Erlang）</div>
          <Input
            value={trafficText}
            onChange={(event) => setTrafficText(event.target.value.replace(/[^\d.]/g, ''))}
            style={{ width: 220 }}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>目标阻塞概率（0–1 之间，如 0.01 表示 1%）</div>
          <Input
            value={targetText}
            onChange={(event) => setTargetText(event.target.value.replace(/[^\d.]/g, ''))}
            style={{ width: 220 }}
          />
        </div>
      </div>
      {'error' in linesView && linesView.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={linesView.error} />
      ) : null}
      {'lines' in linesView && linesView.lines !== undefined ? (
        <>
          <div className={styles.resultGrid}>
            <div className={styles.resultCard}>
              <div className={styles.resultName}>最少中继线数</div>
              <div className={styles.resultValue}>{linesView.lines} 条</div>
              <div className={styles.resultSub}>该线数下实际阻塞 {formatBlocking(linesView.blocking)}</div>
            </div>
          </div>
          <Table
            style={{ marginTop: 16 }}
            size="small"
            pagination={false}
            rowKey="target"
            dataSource={linesView.gos}
            columns={[
              {
                title: '目标 GoS',
                dataIndex: 'target',
                key: 'target',
                render: (value: number) => formatBlocking(value),
              },
              { title: '所需线数', dataIndex: 'lines', key: 'lines' },
              {
                title: '实际阻塞概率',
                dataIndex: 'blocking',
                key: 'blocking',
                render: (value: number) => formatBlocking(value),
              },
            ]}
          />
        </>
      ) : null}
    </div>
  );

  const trafficTab = (
    <div>
      <p className={styles.hint}>给定中继线数与目标服务等级，二分反算该线群可承载的最大话务量（Erlang）。</p>
      <div className={styles.stack}>
        <div>
          <div className={styles.fieldLabel}>中继线数 N（≥1 的整数）</div>
          <InputNumber
            min={1}
            precision={0}
            value={linesText === '' ? null : linesNumber}
            onChange={(value) => setLinesText(value === null ? '' : String(value))}
            style={{ width: 220 }}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>目标阻塞概率（0–1 之间）</div>
          <Input
            value={targetText}
            onChange={(event) => setTargetText(event.target.value.replace(/[^\d.]/g, ''))}
            style={{ width: 220 }}
          />
        </div>
      </div>
      {'error' in trafficView && trafficView.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={trafficView.error} />
      ) : null}
      {'trafficErlang' in trafficView && trafficView.trafficErlang !== undefined ? (
        <div className={styles.resultGrid}>
          <div className={styles.resultCard}>
            <div className={styles.resultName}>可承载话务量</div>
            <div className={styles.resultValue}>{trafficView.trafficErlang.toFixed(4)} Erlang</div>
            <div className={styles.resultSub}>校验阻塞 {formatBlocking(trafficView.blocking)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="Erlang B 中继线话务量计算器（阻塞概率 / 线数 / 负载反算）">
        <Tabs
          items={[
            { key: 'blocking', label: '阻塞概率正算', children: blockingTab },
            { key: 'lines', label: '所需线数反算', children: linesTab },
            { key: 'traffic', label: '可承载话务量反算', children: trafficTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default ErlangBCalculator;
